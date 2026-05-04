import { useState } from 'react';
import { theme } from './theme';

interface Photo {
  id: string;
  url: string;
  caption?: string;
  annotation?: string;
  type: 'gun' | 'target' | 'nfa' | 'receipt';
  date: string;
}

interface PhotoManagerProps {
  photos: Photo[];
  onAddPhoto: (photo: Omit<Photo, 'id' | 'date'>) => void;
  onDeletePhoto: (id: string) => void;
  onUpdateAnnotation: (id: string, annotation: string) => void;
}

export function PhotoManager({ photos, onAddPhoto, onDeletePhoto, onUpdateAnnotation }: PhotoManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newPhotoType, setNewPhotoType] = useState<Photo['type']>('gun');
  const [newPhotoCaption, setNewPhotoCaption] = useState('');

  function handleAddPhoto() {
    if (!newPhotoUrl) return;

    onAddPhoto({
      url: newPhotoUrl,
      caption: newPhotoCaption,
      type: newPhotoType
    });

    setNewPhotoUrl('');
    setNewPhotoCaption('');
    setShowAddForm(false);
  }

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <div style={{
          fontFamily: 'monospace',
          fontSize: '11px',
          letterSpacing: '1px',
          color: theme.textMuted,
          textTransform: 'uppercase'
        }}>
          Photos ({photos.length})
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          style={{
            padding: '8px 16px',
            backgroundColor: theme.accent,
            color: theme.bg,
            border: 'none',
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '11px',
            letterSpacing: '0.8px',
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          + ADD PHOTO
        </button>
      </div>

      {/* Photo Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
        gap: '12px',
        marginBottom: '16px'
      }}>
        {photos.map(photo => (
          <div
            key={photo.id}
            onClick={() => setSelectedPhoto(photo)}
            style={{
              aspectRatio: '1',
              backgroundColor: theme.surfaceAlt,
              borderRadius: '6px',
              overflow: 'hidden',
              cursor: 'pointer',
              position: 'relative',
              border: `0.5px solid ${theme.border}`
            }}
          >
            <img
              src={photo.url}
              alt={photo.caption || 'Photo'}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.innerHTML += `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:${theme.textMuted};font-size:12px">Image unavailable</div>`;
              }}
            />
            {photo.annotation && (
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: 'rgba(0,0,0,0.7)',
                padding: '4px 8px',
                fontSize: '10px',
                color: theme.textPrimary
              }}>
                {photo.annotation}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Photo Form */}
      {showAddForm && (
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
          onClick={() => setShowAddForm(false)}
        >
          <div
            style={{
              backgroundColor: theme.surface,
              borderRadius: '8px',
              padding: '24px',
              maxWidth: '500px',
              width: '100%'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{
              fontFamily: 'monospace',
              fontSize: '14px',
              letterSpacing: '1px',
              margin: '0 0 16px 0'
            }}>
              ADD PHOTO
            </h3>

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '11px',
                color: theme.textSecondary,
                marginBottom: '6px',
                fontFamily: 'monospace'
              }}>
                PHOTO URL
              </label>
              <input
                type="text"
                value={newPhotoUrl}
                onChange={(e) => setNewPhotoUrl(e.target.value)}
                placeholder="https://example.com/photo.jpg"
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: theme.bg,
                  border: `0.5px solid ${theme.border}`,
                  borderRadius: '4px',
                  color: theme.textPrimary,
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '11px',
                color: theme.textSecondary,
                marginBottom: '6px',
                fontFamily: 'monospace'
              }}>
                TYPE
              </label>
              <select
                value={newPhotoType}
                onChange={(e) => setNewPhotoType(e.target.value as Photo['type'])}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: theme.bg,
                  border: `0.5px solid ${theme.border}`,
                  borderRadius: '4px',
                  color: theme.textPrimary,
                  fontSize: '14px'
                }}
              >
                <option value="gun">Gun</option>
                <option value="target">Target</option>
                <option value="nfa">NFA Documentation</option>
                <option value="receipt">Receipt</option>
              </select>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '11px',
                color: theme.textSecondary,
                marginBottom: '6px',
                fontFamily: 'monospace'
              }}>
                CAPTION (OPTIONAL)
              </label>
              <input
                type="text"
                value={newPhotoCaption}
                onChange={(e) => setNewPhotoCaption(e.target.value)}
                placeholder="Add a caption..."
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: theme.bg,
                  border: `0.5px solid ${theme.border}`,
                  borderRadius: '4px',
                  color: theme.textPrimary,
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowAddForm(false)}
                style={{
                  padding: '10px 16px',
                  backgroundColor: 'transparent',
                  color: theme.textPrimary,
                  border: `0.5px solid ${theme.border}`,
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                CANCEL
              </button>
              <button
                onClick={handleAddPhoto}
                style={{
                  padding: '10px 16px',
                  backgroundColor: theme.accent,
                  color: theme.bg,
                  border: 'none',
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                ADD PHOTO
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Viewer Modal */}
      {selectedPhoto && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.95)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '24px'
          }}
          onClick={() => setSelectedPhoto(null)}
        >
          <div style={{ maxWidth: '90vw', maxHeight: '80vh' }}>
            <img
              src={selectedPhoto.url}
              alt={selectedPhoto.caption || 'Photo'}
              style={{
                maxWidth: '100%',
                maxHeight: '80vh',
                objectFit: 'contain',
                borderRadius: '8px'
              }}
            />
          </div>
          {selectedPhoto.caption && (
            <div style={{
              marginTop: '16px',
              color: theme.textPrimary,
              fontSize: '14px',
              textAlign: 'center'
            }}>
              {selectedPhoto.caption}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
