/**
 * src/screens/GameDetailScreen.tsx
 * ---------------------------------
 * Shows full info about a game: thumbnail, description, category badge, age
 * rating, multiplayer flag, visit count, YouTube trailer link, and the list
 * of headsets it's installed on with visual status indicators.
 *
 * CTA: "Start Session" → HeadsetSelectionScreen
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

import { fetchGame, fetchGameInstallations, recordGameVisit } from '../api/games';
import Colors from '../theme/colors';
import Typography from '../theme/typography';
import { useSessionStore } from '../store/sessionStore';
import type { Game, Installation } from '../types';
import type { GameDetailProps } from '../navigation/types';

/** Extract YouTube video ID from watch, short, or embed URLs. */
function getVideoId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)?([\w-]{11})(?:[?&]|$)/,
  );
  return match ? match[1] : null;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_VIDEO_HEIGHT = Math.min(Math.round(SCREEN_WIDTH * 9 / 16), 280);

export default function GameDetailScreen({ route, navigation }: GameDetailProps) {
  const { gameId } = route.params;

  const [game, setGame] = useState<Game | null>(null);
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const setSelectedGame = useSessionStore((s) => s.setSelectedGame);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [g, insts] = await Promise.all([
          fetchGame(gameId),
          fetchGameInstallations(gameId),
        ]);
        if (!cancelled) {
          setGame(g);
          setInstallations(insts);
          // Fire-and-forget visit counter increment
          recordGameVisit(gameId).catch(() => {});
        }
      } catch (e: any) {
        if (!cancelled) setError(e.message ?? 'Failed to load game');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [gameId]);

  const activeInstallations = installations.filter(
    (i) => i.installation_status !== 'EXPIRED',
  );
  const canStartSession = game?.status === 'ACTIVE' && activeInstallations.length > 0;

  const handleStartSession = () => {
    if (!game) return;
    setSelectedGame(game);
    navigation.navigate('TimeSelection', { gameId: game.id });
  };


  if (loading) {
    return (
      <View style={styles.centred}>
        <ActivityIndicator size="large" color={Colors.primary} />
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

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Hero: YouTube player if available, otherwise thumbnail */}
        {game.youtube_url && getVideoId(game.youtube_url) ? (
          <View style={styles.heroVideo}>
            <YoutubeIframe
              videoId={getVideoId(game.youtube_url)!}
              height={HERO_VIDEO_HEIGHT}
              width={SCREEN_WIDTH}
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
                    document.addEventListener('click', function(e) {
                      var el = e.target;
                      while (el) {
                        if (el.tagName === 'A' && el.href &&
                            (el.href.indexOf('youtube.com') !== -1 || el.href.indexOf('youtu.be') !== -1)) {
                          e.preventDefault();
                          e.stopPropagation();
                          return false;
                        }
                        el = el.parentElement;
                      }
                    }, true);
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
            source={{ uri: game.thumbnail_url || 'https://via.placeholder.com/800x300' }}
            style={styles.hero}
            contentFit="cover"
          />
        )}

        {/* Meta info */}
        <View style={styles.meta}>
          {/* Title + category */}
          <View style={styles.titleRow}>
            <Text style={styles.title}>{game.name}</Text>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{game.category}</Text>
            </View>
          </View>

          {/* Badges row: age, multiplayer, visits */}
          <View style={styles.badgeRow}>
            {game.viewable_age != null && (
              <View style={styles.ageBadge}>
                <Ionicons name="person" size={13} color={Colors.textOnPrimary} />
                <Text style={styles.ageBadgeText}>{game.viewable_age}+</Text>
              </View>
            )}
            <View style={[styles.infoBadge, game.is_multiplayer ? styles.multiplayerOn : styles.multiplayerOff]}>
              <Ionicons
                name={game.is_multiplayer ? 'people' : 'person-circle-outline'}
                size={13}
                color={game.is_multiplayer ? Colors.accent : Colors.textMuted}
              />
              <Text style={[styles.infoBadgeText, { color: game.is_multiplayer ? Colors.accent : Colors.textMuted }]}>
                {game.is_multiplayer ? 'Multiplayer' : 'Single Player'}
              </Text>
            </View>
            <View style={styles.visitsBadge}>
              <Ionicons name="eye-outline" size={13} color={Colors.textSecondary} />
              <Text style={styles.visitsText}>{game.visit_count.toLocaleString()} views</Text>
            </View>
          </View>

          {/* Description */}
          <Text style={styles.description} numberOfLines={3} ellipsizeMode="tail">
            {game.description}
          </Text>
        </View>

        {/* Installations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Installed on {installations.length} headset{installations.length !== 1 ? 's' : ''}
          </Text>
          {installations.length === 0 ? (
            <Text style={styles.noInstalls}>
              This game has no headset installations yet.
            </Text>
          ) : (
            <View style={styles.headsetChipsRow}>
              {installations.map((inst) => {
                const dotColor =
                  inst.installation_status === 'ACTIVE'
                    ? Colors.success
                    : inst.installation_status === 'EXPIRING_SOON'
                    ? Colors.warning
                    : Colors.danger;
                return (
                  <View key={inst.id} style={[styles.headsetChip, { borderColor: dotColor }]}>
                    <View style={[styles.headsetDot, { backgroundColor: dotColor }]} />
                    <Text style={styles.headsetChipText}>{inst.headset_code}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Fixed bottom CTA */}
      <View style={styles.footer}>
        {!canStartSession && (
          <Text style={styles.blockedHint}>
            {game.status !== 'ACTIVE'
              ? `Game is ${game.status.toLowerCase()} – sessions unavailable`
              : 'No active headset installations available'}
          </Text>
        )}
        <TouchableOpacity
          style={[styles.ctaButton, !canStartSession && styles.ctaDisabled]}
          onPress={handleStartSession}
          disabled={!canStartSession}
          accessibilityRole="button"
          accessibilityLabel="Start a play session for this game"
        >
          <Text style={styles.ctaText}>🎮 Start Session</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centred: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingBottom: 100 },

  hero: {
    width: '100%',
    height: 160,
    backgroundColor: Colors.surface,
  },
  heroVideo: {
    width: SCREEN_WIDTH,
    height: HERO_VIDEO_HEIGHT,
    backgroundColor: '#000',
  },

  meta: {
    padding: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  title: {
    color: Colors.textPrimary,
    fontSize: Typography['2xl'],
    fontWeight: Typography.bold,
    flex: 1,
  },
  categoryBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    color: Colors.textOnPrimary,
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
  },

  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
    marginBottom: 14,
  },
  ageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.danger,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ageBadgeText: {
    color: Colors.textOnPrimary,
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
  },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  multiplayerOn: {
    borderColor: Colors.accent,
    backgroundColor: 'rgba(0,212,255,0.08)',
  },
  multiplayerOff: {
    borderColor: Colors.disabled,
    backgroundColor: 'transparent',
  },
  infoBadgeText: {
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
  },
  visitsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  visitsText: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
  },

  description: {
    color: Colors.textSecondary,
    fontSize: Typography.base,
    lineHeight: 22,
    marginBottom: 10,
  },

  trailerContainer: {
    marginTop: 4,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceAlt,
  },
  trailerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  trailerLabel: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
  },
  trailerPlayer: {
    width: '100%',
    height: (SCREEN_WIDTH - 40) * (9 / 16), // 16:9 aspect ratio, accounting for padding
    backgroundColor: '#000',
  },

  section: {
    margin: 20,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    marginBottom: 12,
  },
  noInstalls: {
    color: Colors.textMuted,
    fontSize: Typography.base,
  },

  headsetChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  headsetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    backgroundColor: Colors.surfaceAlt,
  },
  headsetDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  headsetChipText: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    letterSpacing: 0.8,
  },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 6,
  },
  blockedHint: {
    color: Colors.warning,
    fontSize: Typography.sm,
    textAlign: 'center',
  },
  ctaButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  ctaDisabled: {
    backgroundColor: Colors.disabled,
  },
  ctaText: {
    color: Colors.textOnPrimary,
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
  },
  errorText: {
    color: Colors.danger,
    fontSize: Typography.base,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
