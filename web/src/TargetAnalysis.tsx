import { useState, useRef, useEffect } from 'react';
import { theme } from './theme';

interface Shot {
  id: number;
  x: number; // Canvas pixel coordinates
  y: number;
}

interface CalibrationData {
  pixelsPerInch: number;
  referenceInches: number;
}

interface AnalysisResults {
  shotCount: number;
  extremeSpreadInches: number;
  extremeSpreadMOA: number;
  extremeSpreadMRAD: number;
  meanRadiusInches: number;
  meanRadiusMOA: number;
  meanRadiusMRAD: number;
  groupCenterX: number;
  groupCenterY: number;
  best3ShotSpread?: number;
  best5ShotSpread?: number;
  extremeShotIndices?: [number, number]; // Indices of the two furthest shots
}

interface PatternAnalysis {
  pattern: 'tight-group' | 'vertical-string' | 'horizontal-string' | 'fliers' | 'scattered' | 'low-left' | 'low-right' | 'high';
  confidence: number;
  description: string;
}

interface CoachingAdvice {
  issue: string;
  cause: string;
  fix: string;
  priority: 'high' | 'medium' | 'low';
}

interface TargetSession {
  id: string;
  date: string;
  timestamp: number;
  distance: number;
  shotCount: number;
  analysis: AnalysisResults;
  pattern: PatternAnalysis;
  imageData?: string; // Base64 encoded canvas
  notes?: string;
  firearm?: string;
  ammunition?: string;
}

export function TargetAnalysis() {
  const [targetImage, setTargetImage] = useState<string | null>(null);
  const [shots, setShots] = useState<Shot[]>([]);
  const [distance, setDistance] = useState<number>(100); // yards
  const [calibration, setCalibration] = useState<CalibrationData | null>(null);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationPoints, setCalibrationPoints] = useState<{ x: number; y: number }[]>([]);
  const [referenceSize, setReferenceSize] = useState<string>('1');
  const [draggedShot, setDraggedShot] = useState<number | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResults | null>(null);
  const [patternAnalysis, setPatternAnalysis] = useState<PatternAnalysis | null>(null);
  const [coachingAdvice, setCoachingAdvice] = useState<CoachingAdvice[]>([]);
  const [isAutoDetecting, setIsAutoDetecting] = useState(false);
  const [sessions, setSessions] = useState<TargetSession[]>([]);
  const [showSessionHistory, setShowSessionHistory] = useState(false);
  const [sessionNotes, setSessionNotes] = useState('');

  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth <= 768);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Load sessions from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('gunvault_target_sessions');
      if (saved) {
        setSessions(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load sessions:', e);
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // Scale pointer/touch position from CSS pixels → canvas logical pixels
  const getCanvasCoords = (clientX: number, clientY: number): { x: number; y: number } => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  };

  // Save session
  const saveSession = () => {
    if (!analysis || !patternAnalysis) return;

    const session: TargetSession = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      timestamp: Date.now(),
      distance,
      shotCount: shots.length,
      analysis,
      pattern: patternAnalysis,
      imageData: canvasRef.current?.toDataURL('image/jpeg', 0.7),
      notes: sessionNotes
    };

    const updatedSessions = [session, ...sessions];
    setSessions(updatedSessions);

    try {
      localStorage.setItem('gunvault_target_sessions', JSON.stringify(updatedSessions));
    } catch (e) {
      console.error('Failed to save session:', e);
    }

    // Clear notes after save
    setSessionNotes('');
  };

  // Delete session
  const deleteSession = (sessionId: string) => {
    const updatedSessions = sessions.filter(s => s.id !== sessionId);
    setSessions(updatedSessions);
    try {
      localStorage.setItem('gunvault_target_sessions', JSON.stringify(updatedSessions));
    } catch (e) {
      console.error('Failed to delete session:', e);
    }
  };

  // Automatic shot detection using image processing
  const detectShots = async () => {
    if (!canvasRef.current || !imageRef.current || !calibration) return;

    setIsAutoDetecting(true);

    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Create a temporary canvas for processing
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return;

      // Draw image to temp canvas
      tempCtx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height);
      const imageData = tempCtx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Convert to grayscale and find dark spots (bullet holes)
      const detectedShots: Shot[] = [];
      const threshold = 80; // Darkness threshold (0-255, lower = darker)
      const minDistance = 20; // Minimum distance between shots in pixels
      const gridSize = 5; // Check every N pixels for performance

      for (let y = 0; y < canvas.height; y += gridSize) {
        for (let x = 0; x < canvas.width; x += gridSize) {
          const i = (y * canvas.width + x) * 4;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const gray = (r + g + b) / 3;

          if (gray < threshold) {
            // Check if this dark spot is far enough from existing shots
            const tooClose = detectedShots.some(shot => {
              const dx = shot.x - x;
              const dy = shot.y - y;
              return Math.sqrt(dx * dx + dy * dy) < minDistance;
            });

            if (!tooClose) {
              // Refine position by finding darkest pixel in local area
              let darkestX = x;
              let darkestY = y;
              let darkestValue = gray;

              for (let dy = -5; dy <= 5; dy++) {
                for (let dx = -5; dx <= 5; dx++) {
                  const nx = x + dx;
                  const ny = y + dy;
                  if (nx >= 0 && nx < canvas.width && ny >= 0 && ny < canvas.height) {
                    const ni = (ny * canvas.width + nx) * 4;
                    const ngray = (data[ni] + data[ni + 1] + data[ni + 2]) / 3;
                    if (ngray < darkestValue) {
                      darkestValue = ngray;
                      darkestX = nx;
                      darkestY = ny;
                    }
                  }
                }
              }

              detectedShots.push({
                id: Date.now() + detectedShots.length,
                x: darkestX,
                y: darkestY
              });
            }
          }
        }
      }

      // Limit to most prominent shots (darkest areas)
      const sortedByDarkness = detectedShots
        .map(shot => {
          const i = (Math.floor(shot.y) * canvas.width + Math.floor(shot.x)) * 4;
          const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
          return { shot, darkness: 255 - gray };
        })
        .sort((a, b) => b.darkness - a.darkness)
        .slice(0, 20) // Limit to 20 shots
        .map(item => item.shot);

      setShots(sortedByDarkness);
    } catch (error) {
      console.error('Auto-detection error:', error);
    } finally {
      setIsAutoDetecting(false);
    }
  };

  // Analyze shot pattern for common issues
  const analyzePattern = (shots: Shot[], centerX: number, centerY: number): PatternAnalysis => {
    if (shots.length < 3) {
      return {
        pattern: 'scattered',
        confidence: 0,
        description: 'Not enough shots for pattern analysis'
      };
    }

    // Calculate shot positions relative to center
    const relativePositions = shots.map(shot => ({
      x: shot.x - centerX,
      y: shot.y - centerY,
      distance: Math.sqrt(Math.pow(shot.x - centerX, 2) + Math.pow(shot.y - centerY, 2))
    }));

    // Check for vertical stringing (common trigger control issue)
    const verticalVariance = relativePositions.reduce((sum, pos) => sum + Math.abs(pos.x), 0) / relativePositions.length;
    const horizontalVariance = relativePositions.reduce((sum, pos) => sum + Math.abs(pos.y), 0) / relativePositions.length;
    const avgDistance = relativePositions.reduce((sum, pos) => sum + pos.distance, 0) / relativePositions.length;

    // Detect fliers (shots far from group)
    const flierCount = relativePositions.filter(pos => pos.distance > avgDistance * 2).length;
    const flierRatio = flierCount / shots.length;

    // Detect consistent bias (e.g., low-left for right-handed shooters)
    const avgX = relativePositions.reduce((sum, pos) => sum + pos.x, 0) / relativePositions.length;
    const avgY = relativePositions.reduce((sum, pos) => sum + pos.y, 0) / relativePositions.length;

    // Pattern detection logic
    if (flierRatio > 0.3) {
      return {
        pattern: 'fliers',
        confidence: 0.8,
        description: 'Multiple shots significantly outside main group'
      };
    }

    if (avgDistance < 30 && verticalVariance < 15 && horizontalVariance < 15) {
      return {
        pattern: 'tight-group',
        confidence: 0.9,
        description: 'Excellent tight grouping'
      };
    }

    if (horizontalVariance > verticalVariance * 2) {
      return {
        pattern: 'horizontal-string',
        confidence: 0.8,
        description: 'Shots forming horizontal pattern'
      };
    }

    if (verticalVariance > horizontalVariance * 2) {
      return {
        pattern: 'vertical-string',
        confidence: 0.8,
        description: 'Shots forming vertical pattern'
      };
    }

    // Check for consistent bias
    if (avgX < -20 && avgY > 20) {
      return {
        pattern: 'low-left',
        confidence: 0.7,
        description: 'Group consistently low and left of center'
      };
    }

    if (avgX > 20 && avgY > 20) {
      return {
        pattern: 'low-right',
        confidence: 0.7,
        description: 'Group consistently low and right of center'
      };
    }

    if (avgY < -20) {
      return {
        pattern: 'high',
        confidence: 0.7,
        description: 'Group consistently high'
      };
    }

    return {
      pattern: 'scattered',
      confidence: 0.6,
      description: 'No clear pattern detected'
    };
  };

  // Generate coaching advice based on pattern
  const generateCoachingAdvice = (pattern: PatternAnalysis): CoachingAdvice[] => {
    const advice: CoachingAdvice[] = [];

    switch (pattern.pattern) {
      case 'vertical-string':
        advice.push({
          issue: 'Vertical Stringing',
          cause: 'Inconsistent trigger control or breathing',
          fix: 'Focus on smooth, straight-back trigger press. Shoot during natural respiratory pause.',
          priority: 'high'
        });
        advice.push({
          issue: 'Trigger Jerk',
          cause: 'Anticipating recoil and pulling trigger',
          fix: 'Practice dry fire. Squeeze trigger slowly and smoothly. Use surprise break technique.',
          priority: 'high'
        });
        break;

      case 'horizontal-string':
        advice.push({
          issue: 'Horizontal Stringing',
          cause: 'Inconsistent grip pressure or lateral trigger movement',
          fix: 'Maintain consistent grip. Press trigger straight back without sideways pressure.',
          priority: 'high'
        });
        advice.push({
          issue: 'Wind Effect',
          cause: 'Possible wind drift at longer distances',
          fix: 'Check wind conditions. Adjust hold or use wind flags.',
          priority: 'medium'
        });
        break;

      case 'low-left':
        advice.push({
          issue: 'Low-Left Impact (Right-Handed)',
          cause: 'Anticipating recoil, pushing forward, or heeling',
          fix: 'Relax. Let recoil happen naturally. Maintain proper grip without death grip.',
          priority: 'high'
        });
        advice.push({
          issue: 'Trigger Finger Placement',
          cause: 'Too much finger on trigger',
          fix: 'Use pad of fingertip, not the crease of first joint.',
          priority: 'medium'
        });
        break;

      case 'low-right':
        advice.push({
          issue: 'Low-Right Impact (Right-Handed)',
          cause: 'Tightening grip during trigger press or thumbing',
          fix: 'Isolate trigger finger. Maintain grip pressure through shot.',
          priority: 'high'
        });
        break;

      case 'high':
        advice.push({
          issue: 'High Impact',
          cause: 'Breaking wrist upward in anticipation or improper sight picture',
          fix: 'Verify zero. Check sight alignment. Avoid pushing or lifting during shot.',
          priority: 'high'
        });
        break;

      case 'fliers':
        advice.push({
          issue: 'Random Fliers',
          cause: 'Called vs uncalled shots, inconsistent fundamentals',
          fix: 'Call your shots. Note which felt different. Check for flinching on certain rounds.',
          priority: 'high'
        });
        advice.push({
          issue: 'Ammunition Consistency',
          cause: 'Possible ammo variation',
          fix: 'Test with match-grade ammo to eliminate variable.',
          priority: 'low'
        });
        break;

      case 'scattered':
        advice.push({
          issue: 'Scattered Group',
          cause: 'Multiple fundamental issues or equipment problems',
          fix: 'Start with basics: stance, grip, sight alignment, trigger control. Check rifle stability/zero.',
          priority: 'high'
        });
        advice.push({
          issue: 'Focus on Fundamentals',
          cause: 'Inconsistent shooting fundamentals',
          fix: 'Slow down. Make every shot count. Practice dry fire extensively.',
          priority: 'high'
        });
        break;

      case 'tight-group':
        advice.push({
          issue: 'Excellent Performance',
          cause: 'Solid fundamentals',
          fix: 'Keep doing what you\'re doing! Document this load/technique.',
          priority: 'low'
        });
        break;
    }

    // Always add general advice
    advice.push({
      issue: 'Consistency Check',
      cause: 'Variable results between sessions',
      fix: 'Log environmental conditions, ammo lot, and how you felt. Look for patterns.',
      priority: 'low'
    });

    return advice;
  };

  // Draw the canvas
  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    // Draw image if loaded
    if (targetImage && imageRef.current) {
      ctx.drawImage(imageRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
    }

    // Draw calibration line if calibrating
    if (isCalibrating && calibrationPoints.length === 1) {
      ctx.strokeStyle = theme.accent;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(calibrationPoints[0].x, calibrationPoints[0].y, 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (isCalibrating && calibrationPoints.length === 2) {
      ctx.strokeStyle = theme.accent;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(calibrationPoints[0].x, calibrationPoints[0].y);
      ctx.lineTo(calibrationPoints[1].x, calibrationPoints[1].y);
      ctx.stroke();

      // Draw endpoints
      ctx.fillStyle = theme.accent;
      ctx.beginPath();
      ctx.arc(calibrationPoints[0].x, calibrationPoints[0].y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(calibrationPoints[1].x, calibrationPoints[1].y, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw group center and radius circle if we have analysis
    if (analysis && shots.length >= 2 && calibration) {
      const centerX = analysis.groupCenterX;
      const centerY = analysis.groupCenterY;

      // Draw mean radius circle
      const meanRadiusPixels = analysis.meanRadiusInches * calibration.pixelsPerInch;
      ctx.strokeStyle = theme.blue;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(centerX, centerY, meanRadiusPixels, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw center point
      ctx.fillStyle = theme.blue;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
      ctx.fill();

      // Draw lines from center to each shot
      ctx.strokeStyle = theme.blue;
      ctx.lineWidth = 0.5;
      ctx.globalAlpha = 0.3;
      shots.forEach(shot => {
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(shot.x, shot.y);
        ctx.stroke();
      });
      ctx.globalAlpha = 1;

      // Highlight extreme spread shots
      if (analysis.extremeShotIndices) {
        const [idx1, idx2] = analysis.extremeShotIndices;
        const shot1 = shots[idx1];
        const shot2 = shots[idx2];

        ctx.strokeStyle = theme.red;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(shot1.x, shot1.y);
        ctx.lineTo(shot2.x, shot2.y);
        ctx.stroke();

        // Draw circles around extreme shots
        ctx.strokeStyle = theme.red;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(shot1.x, shot1.y, 18, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(shot2.x, shot2.y, 18, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Draw shots
    shots.forEach((shot, index) => {
      // Shot marker
      ctx.fillStyle = theme.accent;
      ctx.beginPath();
      ctx.arc(shot.x, shot.y, 8, 0, Math.PI * 2);
      ctx.fill();

      // White border
      ctx.strokeStyle = theme.bg;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(shot.x, shot.y, 8, 0, Math.PI * 2);
      ctx.stroke();

      // Shot number
      ctx.fillStyle = theme.bg;
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText((index + 1).toString(), shot.x, shot.y);
    });
  }, [targetImage, shots, calibration, isCalibrating, calibrationPoints, analysis]);

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Set canvas size to match image aspect ratio
        if (canvasRef.current) {
          const maxWidth = 800;
          const maxHeight = 600;
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }

          canvasRef.current.width = width;
          canvasRef.current.height = height;
        }
        imageRef.current = img;
        setTargetImage(event.target?.result as string);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const placeOrCalibrate = (x: number, y: number) => {
    if (isCalibrating) {
      const newPoints = [...calibrationPoints, { x, y }];
      setCalibrationPoints(newPoints);
      if (newPoints.length === 2) {
        const dx = newPoints[1].x - newPoints[0].x;
        const dy = newPoints[1].y - newPoints[0].y;
        const pixelDistance = Math.sqrt(dx * dx + dy * dy);
        const inches = parseFloat(referenceSize) || 1;
        setCalibration({ pixelsPerInch: pixelDistance / inches, referenceInches: inches });
        setIsCalibrating(false);
        setCalibrationPoints([]);
      }
    } else {
      setShots(prev => [...prev, { id: Date.now(), x, y }]);
    }
  };

  // Handle canvas click
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const { x, y } = getCanvasCoords(e.clientX, e.clientY);
    placeOrCalibrate(x, y);
  };

  // Handle shot drag
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isCalibrating || !canvasRef.current) return;
    const { x, y } = getCanvasCoords(e.clientX, e.clientY);
    const shotIndex = shots.findIndex(shot => {
      const dx = shot.x - x; const dy = shot.y - y;
      return Math.sqrt(dx * dx + dy * dy) <= 10;
    });
    if (shotIndex !== -1) setDraggedShot(shotIndex);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (draggedShot === null || !canvasRef.current) return;
    const { x, y } = getCanvasCoords(e.clientX, e.clientY);
    const newShots = [...shots];
    newShots[draggedShot] = { ...newShots[draggedShot], x, y };
    setShots(newShots);
  };

  const handleMouseUp = () => { setDraggedShot(null); };

  // Handle right click to remove shot
  const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!canvasRef.current || isCalibrating) return;
    const { x, y } = getCanvasCoords(e.clientX, e.clientY);
    const shotIndex = shots.findIndex(shot => {
      const dx = shot.x - x; const dy = shot.y - y;
      return Math.sqrt(dx * dx + dy * dy) <= 10;
    });
    if (shotIndex !== -1) {
      setShots(shots.filter((_, i) => i !== shotIndex));
    }
  };

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    e.preventDefault();
    const touch = e.touches[0];
    const { x, y } = getCanvasCoords(touch.clientX, touch.clientY);
    if (!isCalibrating) {
      const shotIndex = shots.findIndex(shot => {
        const dx = shot.x - x; const dy = shot.y - y;
        return Math.sqrt(dx * dx + dy * dy) <= 20;
      });
      if (shotIndex !== -1) { setDraggedShot(shotIndex); return; }
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (draggedShot === null || !canvasRef.current) return;
    e.preventDefault();
    const touch = e.touches[0];
    const { x, y } = getCanvasCoords(touch.clientX, touch.clientY);
    const newShots = [...shots];
    newShots[draggedShot] = { ...newShots[draggedShot], x, y };
    setShots(newShots);
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (draggedShot !== null) { setDraggedShot(null); return; }
    if (!canvasRef.current) return;
    const touch = e.changedTouches[0];
    const { x, y } = getCanvasCoords(touch.clientX, touch.clientY);
    placeOrCalibrate(x, y);
  };

  // Calculate analysis
  useEffect(() => {
    if (shots.length < 2 || !calibration) {
      setAnalysis(null);
      return;
    }

    // Calculate group center (centroid)
    const centerX = shots.reduce((sum, shot) => sum + shot.x, 0) / shots.length;
    const centerY = shots.reduce((sum, shot) => sum + shot.y, 0) / shots.length;

    // Calculate distances from each shot to center
    const distancesToCenter = shots.map(shot => {
      const dx = shot.x - centerX;
      const dy = shot.y - centerY;
      return Math.sqrt(dx * dx + dy * dy);
    });

    // Mean radius in pixels, then convert to inches
    const meanRadiusPixels = distancesToCenter.reduce((sum, d) => sum + d, 0) / distancesToCenter.length;
    const meanRadiusInches = meanRadiusPixels / calibration.pixelsPerInch;

    // Extreme spread: find two furthest shots
    let maxDistance = 0;
    let extremeIndices: [number, number] = [0, 1];
    for (let i = 0; i < shots.length; i++) {
      for (let j = i + 1; j < shots.length; j++) {
        const dx = shots[j].x - shots[i].x;
        const dy = shots[j].y - shots[i].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > maxDistance) {
          maxDistance = dist;
          extremeIndices = [i, j];
        }
      }
    }
    const extremeSpreadInches = maxDistance / calibration.pixelsPerInch;

    // Convert to MOA and MRAD
    const inchesToMOA = (inches: number) => (inches / distance) * 95.5;
    const inchesToMRAD = (inches: number) => (inches / distance) * 27.78;

    // Calculate best 3-shot and 5-shot groups
    let best3ShotSpread: number | undefined;
    let best5ShotSpread: number | undefined;

    if (shots.length >= 3) {
      let minSpread = Infinity;
      for (let i = 0; i < shots.length - 2; i++) {
        for (let j = i + 1; j < shots.length - 1; j++) {
          for (let k = j + 1; k < shots.length; k++) {
            const group = [shots[i], shots[j], shots[k]];
            let maxDist = 0;
            for (let a = 0; a < group.length; a++) {
              for (let b = a + 1; b < group.length; b++) {
                const dx = group[b].x - group[a].x;
                const dy = group[b].y - group[a].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > maxDist) maxDist = dist;
              }
            }
            if (maxDist < minSpread) minSpread = maxDist;
          }
        }
      }
      best3ShotSpread = minSpread / calibration.pixelsPerInch;
    }

    if (shots.length >= 5) {
      let minSpread = Infinity;
      // For 5-shot, we'll sample combinations (not all permutations for performance)
      const combinations: number[][] = [];
      for (let i = 0; i < shots.length - 4; i++) {
        for (let j = i + 1; j < shots.length - 3; j++) {
          for (let k = j + 1; k < shots.length - 2; k++) {
            for (let l = k + 1; l < shots.length - 1; l++) {
              for (let m = l + 1; m < shots.length; m++) {
                combinations.push([i, j, k, l, m]);
              }
            }
          }
        }
      }

      combinations.forEach(indices => {
        const group = indices.map(idx => shots[idx]);
        let maxDist = 0;
        for (let a = 0; a < group.length; a++) {
          for (let b = a + 1; b < group.length; b++) {
            const dx = group[b].x - group[a].x;
            const dy = group[b].y - group[a].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > maxDist) maxDist = dist;
          }
        }
        if (maxDist < minSpread) minSpread = maxDist;
      });
      best5ShotSpread = minSpread / calibration.pixelsPerInch;
    }

    const analysisResult = {
      shotCount: shots.length,
      extremeSpreadInches,
      extremeSpreadMOA: inchesToMOA(extremeSpreadInches),
      extremeSpreadMRAD: inchesToMRAD(extremeSpreadInches),
      meanRadiusInches,
      meanRadiusMOA: inchesToMOA(meanRadiusInches),
      meanRadiusMRAD: inchesToMRAD(meanRadiusInches),
      groupCenterX: centerX,
      groupCenterY: centerY,
      best3ShotSpread,
      best5ShotSpread,
      extremeShotIndices: extremeIndices
    };

    setAnalysis(analysisResult);

    // Perform pattern analysis and generate coaching
    const pattern = analyzePattern(shots, centerX, centerY);
    setPatternAnalysis(pattern);
    setCoachingAdvice(generateCoachingAdvice(pattern));
  }, [shots, calibration, distance]);

  // Export as image
  const handleExportImage = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `target-analysis-${new Date().toISOString().split('T')[0]}.png`;
    link.href = dataUrl;
    link.click();
  };

  // Export as CSV
  const handleExportCSV = () => {
    if (!analysis || !calibration) return;

    const csvRows = [
      ['Target Analysis Export'],
      ['Date', new Date().toLocaleDateString()],
      ['Distance (yards)', distance.toString()],
      [''],
      ['Group Statistics'],
      ['Shot Count', analysis.shotCount.toString()],
      ['Extreme Spread (in)', analysis.extremeSpreadInches.toFixed(3)],
      ['Extreme Spread (MOA)', analysis.extremeSpreadMOA.toFixed(2)],
      ['Extreme Spread (MRAD)', analysis.extremeSpreadMRAD.toFixed(2)],
      ['Mean Radius (in)', analysis.meanRadiusInches.toFixed(3)],
      ['Mean Radius (MOA)', analysis.meanRadiusMOA.toFixed(2)],
      ['Mean Radius (MRAD)', analysis.meanRadiusMRAD.toFixed(2)],
    ];

    if (analysis.best3ShotSpread !== undefined) {
      csvRows.push(['Best 3-Shot Group (in)', analysis.best3ShotSpread.toFixed(3)]);
    }
    if (analysis.best5ShotSpread !== undefined) {
      csvRows.push(['Best 5-Shot Group (in)', analysis.best5ShotSpread.toFixed(3)]);
    }

    csvRows.push(['']);
    csvRows.push(['Shot Coordinates']);
    csvRows.push(['Shot #', 'X (pixels)', 'Y (pixels)']);
    shots.forEach((shot, i) => {
      csvRows.push([(i + 1).toString(), shot.x.toFixed(1), shot.y.toFixed(1)]);
    });

    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `target-analysis-${new Date().toISOString().split('T')[0]}.csv`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  const buttonStyle = {
    padding: '10px 16px',
    backgroundColor: 'transparent',
    color: theme.textPrimary,
    border: `0.5px solid ${theme.border}`,
    borderRadius: '4px',
    fontFamily: 'monospace',
    fontSize: '11px',
    letterSpacing: '0.8px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  };

  const primaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: theme.accent,
    color: theme.bg,
    border: 'none',
    fontWeight: 600
  };

  const inputStyle = {
    padding: '8px 12px',
    backgroundColor: theme.surface,
    border: `0.5px solid ${theme.border}`,
    borderRadius: '4px',
    color: theme.textPrimary,
    fontFamily: 'monospace',
    fontSize: '12px',
    width: '100%'
  };

  const cardStyle = {
    backgroundColor: theme.surface,
    border: `0.5px solid ${theme.border}`,
    borderRadius: '6px',
    padding: '16px'
  };

  const sectionTitleStyle = {
    fontFamily: 'monospace',
    fontSize: '11px',
    letterSpacing: '1px',
    color: theme.textMuted,
    textTransform: 'uppercase' as const,
    marginBottom: '12px',
    fontWeight: 600
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: theme.bg,
      color: theme.textPrimary,
      padding: '24px'
    }}>
      {/* Header */}
      <div style={{
        borderBottom: `0.5px solid ${theme.border}`,
        paddingBottom: '16px',
        marginBottom: '24px'
      }}>
        <h1 style={{
          fontFamily: 'monospace',
          fontSize: '24px',
          fontWeight: 700,
          letterSpacing: '1.5px',
          margin: '0 0 8px 0'
        }}>
          TARGET ANALYSIS
        </h1>
        <p style={{
          fontFamily: 'monospace',
          fontSize: '11px',
          letterSpacing: '0.5px',
          color: theme.textSecondary,
          margin: 0
        }}>
          Upload target photos, mark shots, and analyze group performance
        </p>
      </div>

      {/* Main Layout: Split View */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 400px',
        gap: '24px',
        alignItems: 'start'
      }}>
        {/* Left: Canvas/Image Area */}
        <div style={cardStyle}>
          {!targetImage ? (
            <div style={{ textAlign: 'center', padding: '48px 24px' }}>
              <div style={{ fontSize: '48px', marginBottom: '20px', opacity: 0.3 }}>🎯</div>
              <div style={{
                fontFamily: 'monospace', fontSize: '13px',
                color: theme.textSecondary, marginBottom: '24px'
              }}>
                Load a target photo to begin analysis
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '260px', margin: '0 auto' }}>
                <label htmlFor="ta-camera-input" style={{
                  display: 'block', padding: '14px 20px', textAlign: 'center',
                  backgroundColor: theme.accent, color: theme.bg,
                  borderRadius: '8px', fontFamily: 'monospace', fontSize: '13px',
                  fontWeight: 700, cursor: 'pointer', letterSpacing: '0.5px',
                }}>
                  📷 Take Photo
                </label>
                <label htmlFor="ta-file-input" style={{
                  display: 'block', padding: '14px 20px', textAlign: 'center',
                  backgroundColor: 'transparent', color: theme.textPrimary,
                  border: `0.5px solid ${theme.border}`, borderRadius: '8px',
                  fontFamily: 'monospace', fontSize: '13px',
                  cursor: 'pointer', letterSpacing: '0.5px',
                }}>
                  🖼 Choose from Library
                </label>
              </div>
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              <canvas
                ref={canvasRef}
                onClick={handleCanvasClick}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onContextMenu={handleContextMenu}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{
                  border: `0.5px solid ${theme.border}`,
                  borderRadius: '4px',
                  cursor: isCalibrating ? 'crosshair' : draggedShot !== null ? 'grabbing' : 'pointer',
                  display: 'block',
                  width: '100%',
                  height: 'auto'
                }}
              />
              <div style={{
                marginTop: '12px',
                display: 'flex',
                gap: '8px',
                fontSize: '10px',
                color: theme.textMuted,
                fontFamily: 'monospace'
              }}>
                {isMobile ? (
                  <>
                    <div>• Tap to place shots</div>
                    <div>• Drag to reposition</div>
                  </>
                ) : (
                  <>
                    <div>• Click to place shots</div>
                    <div>• Drag to reposition</div>
                    <div>• Right-click to remove</div>
                  </>
                )}
              </div>
            </div>
          )}
          <input
            id="ta-file-input"
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            style={{ display: 'none' }}
          />
          <input
            id="ta-camera-input"
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageUpload}
            style={{ display: 'none' }}
          />
        </div>

        {/* Right: Controls & Statistics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Image Controls */}
          {targetImage && (
            <div style={cardStyle}>
              <div style={sectionTitleStyle}>Image</div>
              <button
                onClick={() => {
                  setTargetImage(null);
                  setShots([]);
                  setCalibration(null);
                  setAnalysis(null);
                  if (canvasRef.current) {
                    canvasRef.current.width = 0;
                    canvasRef.current.height = 0;
                  }
                }}
                style={buttonStyle}
              >
                Change Image
              </button>
            </div>
          )}

          {/* Distance & Calibration */}
          <div style={cardStyle}>
            <div style={sectionTitleStyle}>Setup</div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{
                display: 'block',
                fontSize: '10px',
                color: theme.textSecondary,
                marginBottom: '6px',
                fontFamily: 'monospace',
                letterSpacing: '0.5px'
              }}>
                DISTANCE (YARDS)
              </label>
              <input
                type="number"
                value={distance}
                onChange={(e) => setDistance(parseFloat(e.target.value) || 100)}
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{
                display: 'block',
                fontSize: '10px',
                color: theme.textSecondary,
                marginBottom: '6px',
                fontFamily: 'monospace',
                letterSpacing: '0.5px'
              }}>
                REFERENCE SIZE (INCHES)
              </label>
              <input
                type="number"
                step="0.1"
                value={referenceSize}
                onChange={(e) => setReferenceSize(e.target.value)}
                style={inputStyle}
                placeholder="e.g., 1 for 1-inch grid"
              />
            </div>

            {!calibration ? (
              <button
                onClick={() => {
                  setIsCalibrating(true);
                  setCalibrationPoints([]);
                }}
                disabled={!targetImage}
                style={{
                  ...primaryButtonStyle,
                  opacity: !targetImage ? 0.5 : 1,
                  cursor: !targetImage ? 'not-allowed' : 'pointer'
                }}
              >
                {isCalibrating ? 'Click 2 Points on Target...' : 'Calibrate Scale'}
              </button>
            ) : (
              <div>
                <div style={{
                  padding: '8px 12px',
                  backgroundColor: theme.accentDim,
                  border: `0.5px solid ${theme.accent}`,
                  borderRadius: '4px',
                  marginBottom: '8px'
                }}>
                  <div style={{ fontSize: '10px', color: theme.accent, fontFamily: 'monospace' }}>
                    ✓ Calibrated: {calibration.pixelsPerInch.toFixed(1)} px/in
                  </div>
                </div>
                <button
                  onClick={() => {
                    setCalibration(null);
                    setIsCalibrating(true);
                    setCalibrationPoints([]);
                  }}
                  style={buttonStyle}
                >
                  Recalibrate
                </button>
              </div>
            )}
          </div>

          {/* Shot Management */}
          {calibration && (
            <div style={cardStyle}>
              <div style={sectionTitleStyle}>Shots</div>
              <div style={{
                padding: '12px',
                backgroundColor: theme.bg,
                borderRadius: '4px',
                marginBottom: '12px'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'monospace' }}>
                  {shots.length}
                </div>
                <div style={{ fontSize: '10px', color: theme.textMuted }}>shots placed</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  onClick={detectShots}
                  disabled={isAutoDetecting}
                  style={{
                    ...primaryButtonStyle,
                    opacity: isAutoDetecting ? 0.7 : 1,
                    cursor: isAutoDetecting ? 'wait' : 'pointer'
                  }}
                >
                  {isAutoDetecting ? 'Detecting...' : '🤖 Auto-Detect Shots'}
                </button>
                <button
                  onClick={() => setShots([])}
                  disabled={shots.length === 0}
                  style={{
                    ...buttonStyle,
                    opacity: shots.length === 0 ? 0.5 : 1,
                    cursor: shots.length === 0 ? 'not-allowed' : 'pointer',
                    color: theme.red,
                    borderColor: theme.red
                  }}
                >
                  Clear All Shots
                </button>
              </div>
            </div>
          )}

          {/* Statistics */}
          {analysis && (
            <div style={cardStyle}>
              <div style={sectionTitleStyle}>Group Statistics</div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <StatRow
                  label="Extreme Spread"
                  inches={analysis.extremeSpreadInches}
                  moa={analysis.extremeSpreadMOA}
                  mrad={analysis.extremeSpreadMRAD}
                  highlight={theme.red}
                />
                <StatRow
                  label="Mean Radius"
                  inches={analysis.meanRadiusInches}
                  moa={analysis.meanRadiusMOA}
                  mrad={analysis.meanRadiusMRAD}
                  highlight={theme.blue}
                />

                {analysis.best3ShotSpread !== undefined && (
                  <div style={{
                    padding: '8px',
                    backgroundColor: theme.bg,
                    borderRadius: '4px',
                    borderLeft: `3px solid ${theme.green}`
                  }}>
                    <div style={{ fontSize: '10px', color: theme.textMuted, marginBottom: '4px' }}>
                      BEST 3-SHOT GROUP
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: theme.green, fontFamily: 'monospace' }}>
                      {analysis.best3ShotSpread.toFixed(3)}"
                    </div>
                  </div>
                )}

                {analysis.best5ShotSpread !== undefined && (
                  <div style={{
                    padding: '8px',
                    backgroundColor: theme.bg,
                    borderRadius: '4px',
                    borderLeft: `3px solid ${theme.green}`
                  }}>
                    <div style={{ fontSize: '10px', color: theme.textMuted, marginBottom: '4px' }}>
                      BEST 5-SHOT GROUP
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: theme.green, fontFamily: 'monospace' }}>
                      {analysis.best5ShotSpread.toFixed(3)}"
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Save & Export */}
          {analysis && (
            <div style={cardStyle}>
              <div style={sectionTitleStyle}>Save & Export</div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '10px',
                  color: theme.textSecondary,
                  marginBottom: '6px',
                  fontFamily: 'monospace',
                  letterSpacing: '0.5px'
                }}>
                  SESSION NOTES (OPTIONAL)
                </label>
                <textarea
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  placeholder="e.g., Felt good, wind from left, new ammo..."
                  style={{
                    ...inputStyle,
                    minHeight: '60px',
                    resize: 'vertical',
                    fontFamily: 'monospace',
                    fontSize: '11px'
                  }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  onClick={saveSession}
                  style={{
                    ...primaryButtonStyle,
                    backgroundColor: theme.green,
                    fontWeight: 700
                  }}
                >
                  💾 Save Session
                </button>
                <button
                  onClick={() => setShowSessionHistory(true)}
                  disabled={sessions.length === 0}
                  style={{
                    ...buttonStyle,
                    opacity: sessions.length === 0 ? 0.5 : 1,
                    cursor: sessions.length === 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  📊 View History ({sessions.length})
                </button>
                <button onClick={handleExportImage} style={buttonStyle}>
                  Export as Image
                </button>
                <button onClick={handleExportCSV} style={buttonStyle}>
                  Export as CSV
                </button>
              </div>
            </div>
          )}

          {/* Pattern Analysis */}
          {patternAnalysis && shots.length >= 3 && (
            <div style={cardStyle}>
              <div style={sectionTitleStyle}>🎯 Pattern Analysis</div>
              <div style={{
                padding: '12px',
                backgroundColor: theme.bg,
                borderRadius: '4px',
                marginBottom: '8px'
              }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: theme.accent,
                  marginBottom: '4px',
                  textTransform: 'capitalize'
                }}>
                  {patternAnalysis.pattern.replace(/-/g, ' ')}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: theme.textSecondary,
                  marginBottom: '8px'
                }}>
                  {patternAnalysis.description}
                </div>
                <div style={{
                  fontSize: '9px',
                  color: theme.textMuted,
                  fontFamily: 'monospace'
                }}>
                  Confidence: {(patternAnalysis.confidence * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          )}

          {/* Coaching Advice */}
          {coachingAdvice.length > 0 && shots.length >= 3 && (
            <div style={cardStyle}>
              <div style={sectionTitleStyle}>💡 Coaching Recommendations</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {coachingAdvice.map((advice, index) => {
                  const priorityColors = {
                    high: theme.red,
                    medium: theme.orange,
                    low: theme.blue
                  };

                  return (
                    <div
                      key={index}
                      style={{
                        padding: '10px',
                        backgroundColor: theme.bg,
                        borderRadius: '4px',
                        borderLeft: `3px solid ${priorityColors[advice.priority]}`
                      }}
                    >
                      <div style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: theme.textPrimary,
                        marginBottom: '4px'
                      }}>
                        {advice.issue}
                      </div>
                      <div style={{
                        fontSize: '10px',
                        color: theme.textSecondary,
                        marginBottom: '6px',
                        lineHeight: '1.4'
                      }}>
                        <span style={{ color: theme.textMuted }}>Cause:</span> {advice.cause}
                      </div>
                      <div style={{
                        fontSize: '10px',
                        color: theme.textPrimary,
                        lineHeight: '1.4',
                        paddingTop: '6px',
                        borderTop: `1px solid ${theme.border}`
                      }}>
                        <span style={{ color: theme.accent, fontWeight: 600 }}>→</span> {advice.fix}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Session History Modal */}
      {showSessionHistory && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '24px'
          }}
          onClick={() => setShowSessionHistory(false)}
        >
          <div
            style={{
              backgroundColor: theme.surface,
              border: `0.5px solid ${theme.border}`,
              borderRadius: '8px',
              padding: '24px',
              maxWidth: '900px',
              maxHeight: '90vh',
              overflow: 'auto',
              width: '100%'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              paddingBottom: '16px',
              borderBottom: `0.5px solid ${theme.border}`
            }}>
              <h2 style={{
                fontFamily: 'monospace',
                fontSize: '18px',
                fontWeight: 700,
                letterSpacing: '1px',
                margin: 0
              }}>
                SESSION HISTORY
              </h2>
              <button
                onClick={() => setShowSessionHistory(false)}
                style={{
                  ...buttonStyle,
                  padding: '8px 16px',
                  fontSize: '16px'
                }}
              >
                ×
              </button>
            </div>

            {/* Progress Summary */}
            {sessions.length >= 2 && (
              <div style={{
                ...cardStyle,
                marginBottom: '20px',
                backgroundColor: theme.bg
              }}>
                <div style={{ ...sectionTitleStyle, marginBottom: '16px' }}>
                  📈 Progress Overview
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '16px'
                }}>
                  <div>
                    <div style={{ fontSize: '10px', color: theme.textMuted, marginBottom: '4px' }}>
                      LATEST SESSION
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: theme.accent }}>
                      {sessions[0].analysis.extremeSpreadMOA.toFixed(2)} MOA
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: theme.textMuted, marginBottom: '4px' }}>
                      BEST EVER
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: theme.green }}>
                      {Math.min(...sessions.map(s => s.analysis.extremeSpreadMOA)).toFixed(2)} MOA
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: theme.textMuted, marginBottom: '4px' }}>
                      TOTAL SESSIONS
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: theme.blue }}>
                      {sessions.length}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sessions List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {sessions.map((session) => (
                <div
                  key={session.id}
                  style={{
                    ...cardStyle,
                    backgroundColor: theme.bg,
                    display: 'grid',
                    gridTemplateColumns: '200px 1fr auto',
                    gap: '16px',
                    alignItems: 'start'
                  }}
                >
                  {/* Thumbnail */}
                  {session.imageData && (
                    <img
                      src={session.imageData}
                      alt="Target"
                      style={{
                        width: '100%',
                        height: '150px',
                        objectFit: 'cover',
                        borderRadius: '4px',
                        border: `0.5px solid ${theme.border}`
                      }}
                    />
                  )}

                  {/* Session Details */}
                  <div>
                    <div style={{
                      fontSize: '12px',
                      color: theme.textMuted,
                      marginBottom: '8px',
                      fontFamily: 'monospace'
                    }}>
                      {new Date(session.timestamp).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '12px',
                      marginBottom: '12px'
                    }}>
                      <div>
                        <div style={{ fontSize: '9px', color: theme.textMuted, marginBottom: '2px' }}>
                          EXTREME SPREAD
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'monospace' }}>
                          {session.analysis.extremeSpreadMOA.toFixed(2)} MOA
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '9px', color: theme.textMuted, marginBottom: '2px' }}>
                          MEAN RADIUS
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'monospace' }}>
                          {session.analysis.meanRadiusMOA.toFixed(2)} MOA
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '9px', color: theme.textMuted, marginBottom: '2px' }}>
                          SHOTS
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'monospace' }}>
                          {session.shotCount} @ {session.distance}yds
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '9px', color: theme.textMuted, marginBottom: '2px' }}>
                          PATTERN
                        </div>
                        <div style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          color: theme.accent,
                          textTransform: 'capitalize'
                        }}>
                          {session.pattern.pattern.replace(/-/g, ' ')}
                        </div>
                      </div>
                    </div>

                    {session.notes && (
                      <div style={{
                        fontSize: '10px',
                        color: theme.textSecondary,
                        fontStyle: 'italic',
                        padding: '8px',
                        backgroundColor: theme.surface,
                        borderRadius: '4px',
                        borderLeft: `2px solid ${theme.border}`
                      }}>
                        "{session.notes}"
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button
                      onClick={() => deleteSession(session.id)}
                      style={{
                        ...buttonStyle,
                        padding: '6px 12px',
                        fontSize: '10px',
                        color: theme.red,
                        borderColor: theme.red
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {sessions.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                color: theme.textMuted,
                fontSize: '12px'
              }}>
                No saved sessions yet. Complete an analysis and click "Save Session" to track your progress.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface StatRowProps {
  label: string;
  inches: number;
  moa: number;
  mrad: number;
  highlight?: string;
}

function StatRow({ label, inches, moa, mrad, highlight }: StatRowProps) {
  return (
    <div style={{
      padding: '10px',
      backgroundColor: theme.bg,
      borderRadius: '4px',
      borderLeft: highlight ? `3px solid ${highlight}` : undefined
    }}>
      <div style={{
        fontSize: '10px',
        color: theme.textMuted,
        marginBottom: '6px',
        fontFamily: 'monospace',
        letterSpacing: '0.5px'
      }}>
        {label.toUpperCase()}
      </div>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'baseline' }}>
        <div>
          <div style={{
            fontSize: '20px',
            fontWeight: 700,
            fontFamily: 'monospace',
            color: highlight || theme.textPrimary
          }}>
            {inches.toFixed(3)}"
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '11px', color: theme.textSecondary, fontFamily: 'monospace' }}>
            {moa.toFixed(2)} MOA
          </div>
          <div style={{ fontSize: '11px', color: theme.textSecondary, fontFamily: 'monospace' }}>
            {mrad.toFixed(2)} MRAD
          </div>
        </div>
      </div>
    </div>
  );
}
