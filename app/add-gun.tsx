import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { theme, spacing } from '../constants/theme';
import { addGun } from '../lib/database';
import { Button } from '../components/shared/Button';
import type { Gun } from '../db/schema';

type GunAction = Gun['action'];
type GunType = Gun['type'];
type GunCondition = NonNullable<Gun['condition']>;
type GunStatus = Gun['status'];

const ACTIONS: GunAction[] = ['Semi-Auto', 'Bolt', 'Lever', 'Pump', 'Revolver', 'Break', 'Single Shot'];
const TYPES: GunType[] = ['Pistol', 'Rifle', 'Shotgun', 'Suppressor', 'NFA'];
const CONDITIONS: GunCondition[] = ['New', 'Excellent', 'Very Good', 'Good', 'Fair', 'Poor'];
const STATUSES: GunStatus[] = ['Active', 'Stored', 'Transferred'];

export default function AddGun() {
  const router = useRouter();

  // Required
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [caliber, setCaliber] = useState('');
  const [type, setType] = useState<GunType | null>(null);
  const [action, setAction] = useState<GunAction | null>(null);

  // Condition & status
  const [condition, setCondition] = useState<GunCondition | null>(null);
  const [status, setStatus] = useState<GunStatus>('Active');

  // Acquisition
  const [acquiredDate, setAcquiredDate] = useState('');
  const [acquiredPrice, setAcquiredPrice] = useState('');
  const [acquiredFrom, setAcquiredFrom] = useState('');

  // Details
  const [serialNumber, setSerialNumber] = useState('');
  const [barrelLength, setBarrelLength] = useState('');
  const [notes, setNotes] = useState('');

  // NFA
  const [nfaItem, setNfaItem] = useState(false);
  const [suppressorHost, setSuppressorHost] = useState(false);

  const [saving, setSaving] = useState(false);

  const isValid = make.trim() && model.trim() && caliber.trim() && type && action;

  async function handleSave() {
    if (!isValid) {
      Alert.alert('Required Fields', 'Make, model, caliber, type, and action are required.');
      return;
    }

    setSaving(true);
    try {
      await addGun({
        make: make.trim(),
        model: model.trim(),
        caliber: caliber.trim(),
        type: type!,
        action: action!,
        condition: condition ?? undefined,
        status,
        serialNumber: serialNumber.trim() || undefined,
        acquiredDate: acquiredDate.trim() || undefined,
        acquiredPrice: acquiredPrice ? parseFloat(acquiredPrice) : undefined,
        acquiredFrom: acquiredFrom.trim() || undefined,
        barrelLength: barrelLength ? parseFloat(barrelLength) : undefined,
        notes: notes.trim() || undefined,
        nfaItem,
        suppressorHost,
      });
      router.back();
    } catch (error) {
      console.error('Failed to add gun:', error);
      Alert.alert('Error', 'Failed to save firearm. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── IDENTIFICATION ── */}
        <SectionHeader title="Identification" required />

        <FieldLabel label="Make" required />
        <TextInput
          style={styles.input}
          placeholder="e.g. Glock"
          placeholderTextColor={theme.textMuted}
          value={make}
          onChangeText={setMake}
          autoCapitalize="words"
        />

        <FieldLabel label="Model" required />
        <TextInput
          style={styles.input}
          placeholder="e.g. 17 Gen 5"
          placeholderTextColor={theme.textMuted}
          value={model}
          onChangeText={setModel}
          autoCapitalize="words"
        />

        <FieldLabel label="Caliber" required />
        <TextInput
          style={styles.input}
          placeholder="e.g. 9mm"
          placeholderTextColor={theme.textMuted}
          value={caliber}
          onChangeText={setCaliber}
          autoCapitalize="none"
        />

        <FieldLabel label="Type" required />
        <ChipSelector options={TYPES} selected={type} onSelect={(v) => setType(v as GunType)} />

        <FieldLabel label="Action" required />
        <ChipSelector options={ACTIONS} selected={action} onSelect={(v) => setAction(v as GunAction)} />

        {/* ── CONDITION & STATUS ── */}
        <SectionHeader title="Condition & Status" />

        <FieldLabel label="Condition" />
        <ChipSelector options={CONDITIONS} selected={condition} onSelect={(v) => setCondition(v as GunCondition)} />

        <FieldLabel label="Status" />
        <ChipSelector options={STATUSES} selected={status} onSelect={(v) => setStatus(v as GunStatus)} />

        {/* ── ACQUISITION ── */}
        <SectionHeader title="Acquisition" />

        <FieldLabel label="Date Acquired" />
        <TextInput
          style={styles.input}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={theme.textMuted}
          value={acquiredDate}
          onChangeText={setAcquiredDate}
          keyboardType="numbers-and-punctuation"
        />

        <FieldLabel label="Purchase Price ($)" />
        <TextInput
          style={[styles.input, styles.monoInput]}
          placeholder="0.00"
          placeholderTextColor={theme.textMuted}
          value={acquiredPrice}
          onChangeText={setAcquiredPrice}
          keyboardType="decimal-pad"
        />

        <FieldLabel label="Acquired From" />
        <TextInput
          style={styles.input}
          placeholder="e.g. Gun store, private sale"
          placeholderTextColor={theme.textMuted}
          value={acquiredFrom}
          onChangeText={setAcquiredFrom}
          autoCapitalize="words"
        />

        {/* ── DETAILS ── */}
        <SectionHeader title="Details" />

        <FieldLabel label="Serial Number" />
        <TextInput
          style={[styles.input, styles.monoInput]}
          placeholder="Stored locally only"
          placeholderTextColor={theme.textMuted}
          value={serialNumber}
          onChangeText={setSerialNumber}
          autoCapitalize="characters"
          autoCorrect={false}
        />

        <FieldLabel label='Barrel Length (")' />
        <TextInput
          style={[styles.input, styles.monoInput]}
          placeholder='e.g. 4.49'
          placeholderTextColor={theme.textMuted}
          value={barrelLength}
          onChangeText={setBarrelLength}
          keyboardType="decimal-pad"
        />

        <FieldLabel label="Notes" />
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Modifications, history, etc."
          placeholderTextColor={theme.textMuted}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        {/* ── NFA ── */}
        <SectionHeader title="NFA" />

        <ToggleRow
          label="NFA Item"
          sublabel="Suppressor, SBR, SBS, MG, AOW"
          value={nfaItem}
          onToggle={setNfaItem}
        />
        <ToggleRow
          label="Suppressor Host"
          sublabel="Threaded barrel / suppressor-ready"
          value={suppressorHost}
          onToggle={setSuppressorHost}
        />

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* ── FOOTER ── */}
      <View style={styles.footer}>
        <Button title="Cancel" variant="secondary" onPress={() => router.back()} />
        <View style={styles.footerSpacer} />
        <Button
          title="Add to Vault"
          variant="primary"
          onPress={handleSave}
          loading={saving}
          disabled={!isValid}
        />
      </View>
    </View>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function SectionHeader({ title, required }: { title: string; required?: boolean }) {
  return (
    <View style={sectionStyles.container}>
      <Text style={sectionStyles.text}>{title.toUpperCase()}</Text>
      {required && <Text style={sectionStyles.requiredNote}>* required</Text>}
    </View>
  );
}

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <Text style={labelStyles.text}>
      {label}
      {required && <Text style={labelStyles.asterisk}> *</Text>}
    </Text>
  );
}

function ChipSelector({
  options,
  selected,
  onSelect,
}: {
  options: string[];
  selected: string | null;
  onSelect: (value: string) => void;
}) {
  return (
    <View style={chipStyles.container}>
      {options.map((option) => {
        const isSelected = selected === option;
        return (
          <TouchableOpacity
            key={option}
            style={[chipStyles.chip, isSelected && chipStyles.chipSelected]}
            onPress={() => onSelect(option)}
            activeOpacity={0.7}
          >
            <Text style={[chipStyles.text, isSelected && chipStyles.textSelected]}>
              {option}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function ToggleRow({
  label,
  sublabel,
  value,
  onToggle,
}: {
  label: string;
  sublabel: string;
  value: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <View style={toggleStyles.row}>
      <View style={toggleStyles.labels}>
        <Text style={toggleStyles.label}>{label}</Text>
        <Text style={toggleStyles.sublabel}>{sublabel}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: theme.surfaceAlt, true: theme.accent }}
        thumbColor={value ? theme.bg : theme.textMuted}
      />
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  input: {
    backgroundColor: theme.surface,
    borderWidth: 0.5,
    borderColor: theme.border,
    borderRadius: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    color: theme.textPrimary,
    fontSize: 15,
    marginBottom: spacing.md,
    minHeight: 44,
  },
  monoInput: {
    fontFamily: 'monospace',
  },
  textArea: {
    height: 96,
    paddingTop: 12,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingBottom: spacing.xl,
    borderTopWidth: 0.5,
    borderTopColor: theme.border,
    backgroundColor: theme.surface,
  },
  footerSpacer: {
    width: spacing.md,
  },
  bottomSpacer: {
    height: spacing.xxl,
  },
});

const sectionStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.border,
  },
  text: {
    fontFamily: 'monospace',
    fontSize: 10,
    letterSpacing: 1.2,
    color: theme.textMuted,
  },
  requiredNote: {
    fontFamily: 'monospace',
    fontSize: 9,
    letterSpacing: 0.5,
    color: theme.textMuted,
  },
});

const labelStyles = StyleSheet.create({
  text: {
    fontSize: 13,
    color: theme.textSecondary,
    marginBottom: spacing.sm,
  },
  asterisk: {
    color: theme.accent,
  },
});

const chipStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: theme.border,
    backgroundColor: theme.surface,
    minHeight: 44,
    justifyContent: 'center',
  },
  chipSelected: {
    backgroundColor: theme.accentDim,
    borderColor: theme.accent,
  },
  text: {
    fontFamily: 'monospace',
    fontSize: 11,
    letterSpacing: 0.5,
    color: theme.textSecondary,
  },
  textSelected: {
    color: theme.accent,
  },
});

const toggleStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.border,
    minHeight: 56,
  },
  labels: {
    flex: 1,
    marginRight: spacing.lg,
  },
  label: {
    fontSize: 15,
    color: theme.textPrimary,
    marginBottom: 2,
  },
  sublabel: {
    fontSize: 12,
    color: theme.textMuted,
  },
});
