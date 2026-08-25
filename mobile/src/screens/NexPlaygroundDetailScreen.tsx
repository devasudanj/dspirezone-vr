/**
 * src/screens/NexPlaygroundDetailScreen.tsx
 * ------------------------------------------
 * Full detail view for a Nex Playground game. Mirrors GameDetailScreen layout:
 * two-panel landscape, info on the left, actions on the right.
 * CTA: "Start Session" → NexPlaygroundTimeSelectionScreen
 */
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import YoutubeIframe from 'react-native-youtube-iframe';

import { fetchNexGame, recordNexGameVisit } from '../api/nexPlayground';
import Colors from '../theme/colors';
import Typography from '../theme/typography';
import { useNexSessionStore } from '../store/nexSessionStore';
import { trackNexDetailViewed } from '../utils/analytics';
import { getYouTubeVideoId } from '../utils/trailers';
import type { NexGame } from '../types';
import type { NexPlaygroundDetailProps } from '../navigation/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const LEFT_PANEL_WIDTH = Math.round(SCREEN_WIDTH * 0.52);
const MEDIA_HEIGHT = 260;

export default function NexPlaygroundDetailScreen({
  route,
  navigation,
}: NexPlaygroundDetailProps) {
  const { gameId } = route.params;
  const [game, setGame] = useState<NexGame | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const setSelectedGame = useNexSessionStore((s) => s.setSelectedGame);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const g = await fetchNexGame(gameId);
        if (!cancelled) {
          setGame(g);
          trackNexDetailViewed(g.id, g.name);
          recordNexGameVisit(gameId).catch(() => {});
        }
      } catch (e: any) {
        if (!cancelled) setError(e.message ?? 'Failed to load game');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [gameId]);

  const handleStartSession = () => {
    if (!game) return;
    setSelectedGame(game);
    navigation.navigate('NexSessionContact', { gameId: game.id });
  };

  if (loading) {
    return (
      <View style={styles.centred}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  if (error || !game) {
    return (
      <View style={styles.centred}>
        <Text style={styles.errorText}>{error ?? 'Game not found'}</Text>
      </View>
    );
  }

  const canStart = game.status === 'ACTIVE';
  const trailerVideoId = getYouTubeVideoId(game.trailer_url);

  return (
    <View style={styles.container}>
      <View style={styles.body}>
        {/* LEFT PANEL – trailer/thumbnail + description */}
        <View style={[styles.leftPanel, { width: LEFT_PANEL_WIDTH }]}>
          {trailerVideoId ? (
            <View style={styles.videoWrapper}>
              <YoutubeIframe
                videoId={trailerVideoId}
                height={MEDIA_HEIGHT}
                width={LEFT_PANEL_WIDTH}
                play={false}
                allowWebViewZoom={false}
                initialPlayerParams={{ modestbranding: 1, rel: 0, preventFullScreen: false }}
                webViewProps={{
                  injectedJavaScript: `
                    (function() {
                      var style = document.createElement('style');
                      style.textContent = [
                        '.ytp-youtube-button { display: none !important; }',
                        '.ytp-watermark { display: none !important; }',
                        '.ytp-chrome-top { display: none !important; }',
                        '.ytp-chrome-top-buttons { display: none !important; }',
                        '.ytp-share-button { display: none !important; }',
                        '.ytp-overflow-button { display: none !important; }',
                        'a[href*="youtube.com"] { pointer-events: none !important; cursor: default !important; }',
                        'a[href*="youtu.be"] { pointer-events: none !important; cursor: default !important; }',
                      ].join('');
                      document.head.appendChild(style);
                    })();
                    true;
                  `,
                  mediaPlaybackRequiresUserAction: false,
                  onShouldStartLoadWithRequest: (request: { url: string }) => {
                    const url = request.url || '';
                    if (url.includes('youtube.com') || url.includes('youtu.be')) {
                      if (!url.includes('youtube.com/embed') && !url.includes('youtube-nocookie.com')) {
                        return false;
                      }
                    }
                    return true;
                  },
                }}
              />
            </View>
          ) : (
            <Image
              source={{ uri: game.thumbnail_url || 'https://via.placeholder.com/600x340' }}
              style={styles.thumbnail}
              contentFit="cover"
            />
          )}
          <ScrollView style={styles.descScroll} contentContainerStyle={styles.descContent}>
            <Text style={styles.descTitle}>About</Text>
            <Text style={styles.descText}>{game.description}</Text>
          </ScrollView>
        </View>

        {/* RIGHT PANEL – metadata + CTA */}
        <ScrollView style={styles.rightPanel} contentContainerStyle={styles.rightContent}>
          {/* Platform badge */}
          <View style={styles.platformBadge}>
            <Ionicons name="body-outline" size={14} color={Colors.accent} />
            <Text style={styles.platformText}>Nex Playground</Text>
          </View>

          <Text style={styles.gameName}>{game.name}</Text>

          {/* Category */}
          <View style={styles.metaRow}>
            <View style={styles.chip}>
              <Text style={styles.chipText}>{game.category}</Text>
            </View>
            {game.is_multiplayer && (
              <View style={[styles.chip, styles.multiplayerChip]}>
                <Ionicons name="people" size={12} color={Colors.accent} />
                <Text style={[styles.chipText, styles.multiplayerChipText]}>Multiplayer</Text>
              </View>
            )}
          </View>

          {/* Specs */}
          <View style={styles.specsGrid}>
            <SpecItem
              icon="people-outline"
              label="Players"
              value={`1–${game.max_players}`}
            />
            {game.min_age !== null && (
              <SpecItem
                icon="person-outline"
                label="Min Age"
                value={`${game.min_age}+`}
              />
            )}
            <SpecItem
              icon="pulse-outline"
              label="Activity"
              value="Full-body"
            />
          </View>

          {/* Status */}
          {game.status !== 'ACTIVE' && (
            <View style={styles.statusBanner}>
              <Text style={styles.statusBannerText}>
                {game.status === 'DISABLED' ? 'This game is disabled' : 'Currently unavailable'}
              </Text>
            </View>
          )}

          {game.trailer_url && !trailerVideoId && (
            <View style={styles.trailerButton} accessibilityRole="image">
              <Ionicons name="logo-youtube" size={20} color={Colors.textOnPrimary} />
              <Text style={styles.trailerButtonText}>Trailer unavailable</Text>
            </View>
          )}

          {/* CTA */}
          <TouchableOpacity
            style={[styles.ctaButton, !canStart && styles.ctaDisabled]}
            onPress={handleStartSession}
            disabled={!canStart}
            accessibilityRole="button"
            accessibilityLabel="Start Nex Playground session"
            accessibilityState={{ disabled: !canStart }}
          >
            <Ionicons name="play-circle-outline" size={22} color={Colors.textOnPrimary} />
            <Text style={styles.ctaText}>Start Session</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
}

function SpecItem({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.specItem}>
      <Ionicons name={icon} size={18} color={Colors.accent} />
      <View>
        <Text style={styles.specLabel}>{label}</Text>
        <Text style={styles.specValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centred: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: Colors.danger, fontSize: Typography.base },
  body: { flex: 1, flexDirection: 'row' },
  leftPanel: {
    backgroundColor: Colors.surfaceAlt,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
  },
  thumbnail: { width: '100%', height: MEDIA_HEIGHT },
  videoWrapper: {
    width: '100%',
    height: MEDIA_HEIGHT,
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  descScroll: { flex: 1 },
  descContent: { padding: 20 },
  descTitle: {
    fontSize: Typography.md,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  descText: {
    fontSize: Typography.base,
    fontWeight: Typography.regular,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  rightPanel: { flex: 1 },
  rightContent: { padding: 24, gap: 16 },
  platformBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: Colors.accent + '22',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  platformText: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.accent,
  },
  gameName: {
    fontSize: Typography['2xl'],
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  metaRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  multiplayerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderColor: Colors.accent,
    backgroundColor: Colors.surface,
  },
  chipText: {
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
    color: Colors.textSecondary,
  },
  multiplayerChipText: {
    color: Colors.accent,
  },
  specsGrid: { gap: 12 },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  specLabel: {
    fontSize: Typography.xs,
    fontWeight: Typography.regular,
    color: Colors.textMuted,
  },
  specValue: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
  },
  statusBanner: {
    backgroundColor: Colors.warning + '22',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.warning,
  },
  statusBannerText: {
    color: Colors.warning,
    fontWeight: Typography.semibold,
    fontSize: Typography.sm,
  },
  trailerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#d61f1f',
    borderRadius: 12,
    paddingVertical: 12,
  },
  trailerButtonText: {
    color: Colors.textOnPrimary,
    fontSize: Typography.base,
    fontWeight: Typography.bold,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.accent,
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 8,
  },
  ctaDisabled: { backgroundColor: Colors.disabled },
  ctaText: {
    fontSize: Typography.md,
    fontWeight: Typography.bold,
    color: Colors.textOnPrimary,
  },
});
