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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
// Left panel = 75% of screen width, 16:9 video height
const VIDEO_PANEL_WIDTH = Math.round(SCREEN_WIDTH * 0.75);
const VIDEO_PANEL_HEIGHT = Math.round(VIDEO_PANEL_WIDTH * 9 / 16);

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
    navigation.navigate('SessionContact', { gameId: game.id });
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
      {/* ── Side-by-side landscape layout ── */}
      <View style={styles.body}>

        {/* LEFT PANEL – fixed YouTube video (or thumbnail fallback) */}
        <View style={styles.leftPanel}>
          {game.youtube_url && getVideoId(game.youtube_url) ? (
            <View style={styles.videoWrapper}>
              <YoutubeIframe
                videoId={getVideoId(game.youtube_url)!}
                height={VIDEO_PANEL_HEIGHT}
                width={VIDEO_PANEL_WIDTH}
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
              source={{ uri: game.thumbnail_url || 'https://via.placeholder.com/800x450' }}
              style={styles.thumbnailFallback}
              contentFit="cover"
            />
          )}
        </View>

        {/* RIGHT PANEL – scrollable game info + headsets */}
        <ScrollView
          style={styles.rightPanel}
          contentContainerStyle={styles.rightScroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Title + category */}
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={2}>{game.name}</Text>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{game.category}</Text>
            </View>
          </View>

          {/* Badges row: age, multiplayer, visits */}
          <View style={styles.badgeRow}>
            {game.pricing_category && (
              <View style={styles.pricingBadge}>
                <Ionicons name="pricetag-outline" size={12} color={Colors.warning} />
                <Text style={styles.pricingBadgeText}>{game.pricing_category}</Text>
              </View>
            )}
            {game.viewable_age != null && (
              <View style={styles.ageBadge}>
                <Ionicons name="person" size={12} color={Colors.textOnPrimary} />
                <Text style={styles.ageBadgeText}>{game.viewable_age}+</Text>
              </View>
            )}
            <View style={[styles.infoBadge, game.is_multiplayer ? styles.multiplayerOn : styles.multiplayerOff]}>
              <Ionicons
                name={game.is_multiplayer ? 'people' : 'person-circle-outline'}
                size={12}
                color={game.is_multiplayer ? Colors.accent : Colors.textMuted}
              />
              <Text style={[styles.infoBadgeText, { color: game.is_multiplayer ? Colors.accent : Colors.textMuted }]}>
                {game.is_multiplayer ? 'Multiplayer' : 'Single Player'}
              </Text>
            </View>
            <View style={styles.visitsBadge}>
              <Ionicons name="eye-outline" size={12} color={Colors.textSecondary} />
              <Text style={styles.visitsText}>{game.visit_count.toLocaleString()} views</Text>
            </View>
          </View>

          {/* Description */}
          <Text style={styles.description}>
            {game.description}
          </Text>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Installed headsets */}
          <Text style={styles.sectionTitle}>
            Installed on {installations.length} headset{installations.length !== 1 ? 's' : ''}
          </Text>
          {installations.length === 0 ? (
            <Text style={styles.noInstalls}>No headset installations yet.</Text>
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

          {/* Bottom padding so content clears the footer */}
          <View style={{ height: 90 }} />
        </ScrollView>
      </View>

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

  // ── Main horizontal split ──
  body: {
    flex: 1,
    flexDirection: 'row',
  },

  // ── Left panel: fixed video ──
  leftPanel: {
    width: VIDEO_PANEL_WIDTH,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoWrapper: {
    width: VIDEO_PANEL_WIDTH,
    height: VIDEO_PANEL_HEIGHT,
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  thumbnailFallback: {
    width: VIDEO_PANEL_WIDTH,
    height: VIDEO_PANEL_HEIGHT,
    backgroundColor: Colors.surface,
  },

  // ── Right panel: scrollable info ──
  rightPanel: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  rightScroll: {
    padding: 16,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  title: {
    color: Colors.textPrimary,
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    flex: 1,
  },
  categoryBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 3,
  },
  categoryText: {
    color: Colors.textOnPrimary,
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
  },

  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  ageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.danger,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  ageBadgeText: {
    color: Colors.textOnPrimary,
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
  },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
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
    fontSize: Typography.xs,
    fontWeight: Typography.medium,
  },
  visitsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  visitsText: {
    color: Colors.textSecondary,
    fontSize: Typography.xs,
  },
  pricingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.warning + '22',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  pricingBadgeText: {
    color: Colors.warning,
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
  },

  description: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
    lineHeight: 20,
    marginBottom: 14,
  },

  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: 14,
  },

  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    marginBottom: 10,
  },
  noInstalls: {
    color: Colors.textMuted,
    fontSize: Typography.sm,
  },
  headsetChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  headsetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1.5,
    backgroundColor: Colors.surfaceAlt,
  },
  headsetDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  headsetChipText: {
    color: Colors.textPrimary,
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
    letterSpacing: 0.8,
  },

  // ── Footer CTA ──
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 5,
  },
  blockedHint: {
    color: Colors.warning,
    fontSize: Typography.xs,
    textAlign: 'center',
  },
  ctaButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 13,
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
