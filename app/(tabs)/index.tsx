import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { theme, spacing } from '../../constants/theme';
import { initDatabase, getAllGuns } from '../../lib/database';
import { GunCard } from '../../components/gun-vault/GunCard';
import { GunRow } from '../../components/gun-vault/GunRow';
import { Button } from '../../components/shared/Button';
import type { Gun } from '../../db/schema';

type ViewMode = 'card' | 'table';

export default function GunVault() {
  const router = useRouter();
  const [guns, setGuns] = useState<Gun[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('card');

  useEffect(() => {
    initDatabase().then(loadGuns);
  }, []);

  // Refresh list when returning from Add Gun screen
  useFocusEffect(
    useCallback(() => {
      if (!loading) loadGuns();
    }, [loading])
  );

  async function loadGuns() {
    try {
      const allGuns = await getAllGuns();
      setGuns(allGuns);
    } catch (error) {
      console.error('Failed to load guns:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleGunPress(gun: Gun) {
    // TODO: Navigate to gun detail screen
    console.log('Gun pressed:', gun.id);
  }

  function handleAddGun() {
    router.push('/add-gun');
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>GUN VAULT</Text>
        <Text style={styles.count}>
          {guns.length} firearm{guns.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* View toggle and Add button */}
      <View style={styles.controls}>
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.toggleButton, viewMode === 'card' && styles.toggleButtonActive]}
            onPress={() => setViewMode('card')}
          >
            <Text style={[styles.toggleText, viewMode === 'card' && styles.toggleTextActive]}>
              CARD
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, viewMode === 'table' && styles.toggleButtonActive]}
            onPress={() => setViewMode('table')}
          >
            <Text style={[styles.toggleText, viewMode === 'table' && styles.toggleTextActive]}>
              TABLE
            </Text>
          </TouchableOpacity>
        </View>

        <Button title="+ Add Gun" variant="primary" onPress={handleAddGun} />
      </View>

      {/* Gun list */}
      {guns.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No firearms in vault</Text>
          <Text style={styles.emptySubtext}>
            Tap "+ Add Gun" to add your first firearm
          </Text>
        </View>
      ) : (
        <FlatList
          data={guns}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) =>
            viewMode === 'card' ? (
              <GunCard gun={item} onPress={() => handleGunPress(item)} />
            ) : (
              <GunRow gun={item} onPress={() => handleGunPress(item)} />
            )
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.bg,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.border,
  },
  title: {
    fontFamily: 'monospace',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: theme.textPrimary,
    marginBottom: 4,
  },
  count: {
    fontFamily: 'monospace',
    fontSize: 11,
    letterSpacing: 0.5,
    color: theme.textSecondary,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  viewToggle: {
    flexDirection: 'row',
    borderWidth: 0.5,
    borderColor: theme.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  toggleButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: 'transparent',
  },
  toggleButtonActive: {
    backgroundColor: theme.textPrimary,
  },
  toggleText: {
    fontFamily: 'monospace',
    fontSize: 10,
    letterSpacing: 0.8,
    color: theme.textSecondary,
  },
  toggleTextActive: {
    color: theme.bg,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyText: {
    fontFamily: 'monospace',
    fontSize: 12,
    letterSpacing: 0.8,
    color: theme.textMuted,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
  },
});
