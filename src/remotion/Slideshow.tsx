import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide, type SlideDirection } from "@remotion/transitions/slide";
import { Fragment, useMemo } from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  interpolate,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import type { RemotionProps, RemotionTheme } from "../lib/video/remotion-props";
import { beatFrames, getMusicBeatMetadata, snapToBeat } from "./beats";
import { WordCaptions } from "./captions";
import {
  ARCHIVO_BLACK_FONT_FAMILY,
  REMOTION_FONT_STACK,
  useRemotionFonts,
} from "./fonts";
import { RIGHT_SAFE, SafeArea } from "./layout";
import { resolveAudioSrc, resolveMediaSrc, themeOrDefault } from "./media";
import {
  BackgroundWash,
  BrandBug,
  GrainOverlay,
  HashtagRow,
  StickerChip,
} from "./primitives";
import { parseCompositionProps } from "./props";

const FALLBACK_BPM = 120;
const HOOK_WORDS_PER_SECOND = 6.6;
const HOOK_FADE_IN_FRAMES = 5;
const HOOK_HOLD_UNTIL_FRAME = 60;
const HOOK_FADE_OUT_FRAMES = 12;
const HOOK_END_FRAME = HOOK_HOLD_UNTIL_FRAME + HOOK_FADE_OUT_FRAMES;
const SAFE_LEFT = 54;
const TRANSITION_MIN_FRAMES = 8;
const TRANSITION_MAX_FRAMES = 12;

type SlideshowSlide = NonNullable<RemotionProps["slideshow"]>["slides"][number];

type SlideTiming = {
  endFrame: number;
  sequenceDuration: number;
  startFrame: number;
  visibleDuration: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function transitionFramesForBeat(bpm: number, fps: number): number {
  return Math.round(
    clamp(
      beatFrames(bpm, fps) * 0.72,
      TRANSITION_MIN_FRAMES,
      TRANSITION_MAX_FRAMES,
    ),
  );
}

function beatCountsForSlides(slideCount: number, totalBeatCount: number) {
  const baseBeatCount = Math.max(1, Math.floor(totalBeatCount / slideCount));
  const remainder = Math.max(0, totalBeatCount - baseBeatCount * slideCount);

  return Array.from(
    { length: slideCount },
    (_, index) => baseBeatCount + (index < remainder ? 1 : 0),
  );
}

function buildBeatSnappedStarts({
  bpm,
  downbeatOffsetSec,
  durationInFrames,
  fps,
  slideCount,
}: {
  bpm: number;
  downbeatOffsetSec: number;
  durationInFrames: number;
  fps: number;
  slideCount: number;
}) {
  const framesPerBeat = beatFrames(bpm, fps);
  const minGap = Math.max(
    1,
    Math.min(
      Math.round(framesPerBeat),
      Math.floor(durationInFrames / slideCount),
    ),
  );
  const totalBeatCount = Math.max(
    1,
    Math.round(durationInFrames / framesPerBeat),
  );
  const canUseWholeBeatWindows = totalBeatCount >= slideCount;
  const beatCounts = canUseWholeBeatWindows
    ? beatCountsForSlides(slideCount, totalBeatCount)
    : [];
  const starts = [0];
  let cumulativeBeats = 0;

  for (let index = 1; index < slideCount; index += 1) {
    const idealFrame = (durationInFrames / slideCount) * index;

    if (canUseWholeBeatWindows) {
      cumulativeBeats += beatCounts[index - 1];
    }

    const candidate = canUseWholeBeatWindows
      ? snapToBeat(
          cumulativeBeats * framesPerBeat,
          bpm,
          fps,
          downbeatOffsetSec,
          "nearest",
        )
      : snapToBeat(idealFrame, bpm, fps, downbeatOffsetSec, "nearest");
    const remainingSlides = slideCount - index;
    const minStart = starts[index - 1] + minGap;
    const maxStart = durationInFrames - remainingSlides * minGap;

    starts.push(Math.round(clamp(candidate, minStart, maxStart)));
  }

  return starts;
}

function buildSlideTimings({
  durationInFrames,
  fps,
  musicSrc,
  slideCount,
}: {
  durationInFrames: number;
  fps: number;
  musicSrc: string | undefined;
  slideCount: number;
}) {
  const beatMetadata = getMusicBeatMetadata(musicSrc) ?? {
    bpm: FALLBACK_BPM,
    downbeatOffsetSec: 0,
  };
  const transitionDuration = transitionFramesForBeat(beatMetadata.bpm, fps);
  const starts = buildBeatSnappedStarts({
    bpm: beatMetadata.bpm,
    downbeatOffsetSec: beatMetadata.downbeatOffsetSec,
    durationInFrames,
    fps,
    slideCount,
  });

  return {
    timings: starts.map((startFrame, index): SlideTiming => {
      const endFrame =
        index === starts.length - 1 ? durationInFrames : starts[index + 1];
      const visibleDuration = Math.max(1, endFrame - startFrame);

      return {
        endFrame,
        sequenceDuration:
          index === starts.length - 1
            ? visibleDuration
            : visibleDuration + transitionDuration,
        startFrame,
        visibleDuration,
      };
    }),
    transitionDuration,
  };
}

function getActiveSlideIndex(timings: SlideTiming[], frame: number): number {
  let activeIndex = 0;

  for (let index = 0; index < timings.length; index += 1) {
    if (frame >= timings[index].startFrame) {
      activeIndex = index;
    }
  }

  return activeIndex;
}

function hookFontSize(text: string): number {
  if (text.length > 58) {
    return 60;
  }

  if (text.length > 42) {
    return 66;
  }

  return 72;
}

function transitionPresentation(index: number) {
  if (index % 3 === 0) {
    return fade({ shouldFadeOutExitingScene: true });
  }

  const direction: SlideDirection =
    index % 2 === 0 ? "from-left" : "from-right";

  return slide({ direction });
}

function SlideScene({
  index,
  slide: currentSlide,
  theme,
  timing,
}: {
  index: number;
  slide: SlideshowSlide;
  theme: RemotionTheme;
  timing: SlideTiming;
}) {
  useRemotionFonts();

  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const motionFrame = Math.min(frame, timing.visibleDuration);
  const zoomIn = index % 2 === 0;
  const scale = interpolate(
    motionFrame,
    [0, timing.sequenceDuration],
    zoomIn ? [1, 1.12] : [1.12, 1],
    {
      easing: Easing.inOut(Easing.quad),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const panX = interpolate(
    motionFrame,
    [0, timing.sequenceDuration],
    zoomIn ? [-28, 22] : [24, -30],
    {
      easing: Easing.inOut(Easing.quad),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const panY = interpolate(
    motionFrame,
    [0, timing.sequenceDuration],
    index % 2 === 0 ? [22, -20] : [-18, 24],
    {
      easing: Easing.inOut(Easing.quad),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const captionPop = spring({
    config: {
      damping: 18,
      stiffness: 190,
    },
    fps,
    frame: frame - 4,
  });
  const captionOpacity = interpolate(frame, [0, 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const accentScale = interpolate(frame, [6, 22], [0.24, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: theme.background,
        overflow: "hidden",
      }}
    >
      <Img
        src={resolveMediaSrc(currentSlide.image)}
        style={{
          filter: "saturate(1.14) contrast(1.04)",
          height: "108%",
          left: "-4%",
          objectFit: "cover",
          position: "absolute",
          top: "-4%",
          transform: `translate3d(${panX}px, ${panY}px, 0) scale(${scale})`,
          width: "108%",
        }}
      />
      <div
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.18) 34%, rgba(0,0,0,0.2) 58%, rgba(0,0,0,0.78) 100%)",
          inset: 0,
          position: "absolute",
        }}
      />
      <div
        style={{
          background: `linear-gradient(135deg, ${theme.accent} 0%, transparent 42%, ${theme.secondary} 100%)`,
          inset: 0,
          mixBlendMode: "soft-light",
          opacity: 0.28,
          position: "absolute",
        }}
      />

      <SafeArea
        style={{
          paddingLeft: SAFE_LEFT,
          paddingRight: RIGHT_SAFE,
        }}
      >
        <div style={{ height: "100%", position: "relative" }}>
          {currentSlide.eyebrow ? (
            <div
              style={{
                left: 10,
                position: "absolute",
                top: 505,
              }}
            >
              <StickerChip
                background={theme.accent}
                color={theme.background}
                rotationDeg={index % 2 === 0 ? -4 : 4}
                startFrame={0}
                style={{
                  fontSize: 29,
                  padding: "16px 22px",
                }}
              >
                {currentSlide.eyebrow}
              </StickerChip>
            </div>
          ) : null}

          <div
            style={{
              bottom: 176,
              left: 0,
              opacity: captionOpacity,
              position: "absolute",
              right: 0,
              transform: `translateY(${(1 - captionPop) * 44}px) scale(${
                0.96 + Math.min(1, captionPop) * 0.04
              })`,
              transformOrigin: "left bottom",
            }}
          >
            <div
              style={{
                background: theme.accent,
                borderRadius: 999,
                height: 8,
                marginBottom: 18,
                transform: `scaleX(${accentScale})`,
                transformOrigin: "left",
                width: 168,
              }}
            />
            <div
              style={{
                color: theme.foreground,
                fontFamily: REMOTION_FONT_STACK,
                fontSize: 44,
                fontWeight: 900,
                letterSpacing: 0,
                lineHeight: 0.98,
                maxWidth: 820,
                textShadow:
                  "0 4px 0 rgba(0,0,0,0.58), 0 18px 44px rgba(0,0,0,0.54)",
              }}
            >
              {currentSlide.caption}
            </div>
          </div>
        </div>
      </SafeArea>
    </AbsoluteFill>
  );
}

function ProgressSegments({
  activeIndex,
  frame,
  theme,
  timings,
}: {
  activeIndex: number;
  frame: number;
  theme: RemotionTheme;
  timings: SlideTiming[];
}) {
  return (
    <div
      style={{
        bottom: 20,
        display: "flex",
        gap: 9,
        height: 10,
        left: 72,
        position: "absolute",
        right: 72,
      }}
    >
      {timings.map((timing, index) => {
        const fill =
          index < activeIndex
            ? 1
            : index > activeIndex
              ? 0
              : clamp(
                  (frame - timing.startFrame) / timing.visibleDuration,
                  0,
                  1,
                );

        return (
          <div
            key={`${timing.startFrame}-${index}`}
            style={{
              background: "rgba(255,255,255,0.26)",
              borderRadius: 999,
              flex: 1,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                background: theme.accent,
                borderRadius: 999,
                boxShadow: `0 0 22px ${theme.accent}`,
                height: "100%",
                width: `${fill * 100}%`,
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

function CaptionRow({
  caption,
  theme,
}: {
  caption: string | undefined;
  theme: RemotionTheme;
}) {
  if (!caption) {
    return null;
  }

  return (
    <div
      style={{
        bottom: 116,
        color: "rgba(248,250,252,0.82)",
        fontFamily: REMOTION_FONT_STACK,
        fontSize: 24,
        fontWeight: 800,
        left: 72,
        letterSpacing: 0,
        lineHeight: 1.12,
        maxWidth: 720,
        position: "absolute",
        right: 72,
        textShadow: "0 8px 28px rgba(0,0,0,0.58)",
      }}
    >
      <span style={{ color: theme.foreground }}>{caption}</span>
    </div>
  );
}

function HookOverlay({
  kicker,
  props,
  theme,
}: {
  kicker: string | undefined;
  props: RemotionProps;
  theme: RemotionTheme;
}) {
  const frame = useCurrentFrame();
  const hookOpacity = interpolate(
    frame,
    [0, HOOK_FADE_IN_FRAMES, HOOK_HOLD_UNTIL_FRAME, HOOK_END_FRAME],
    [0, 1, 1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  return (
    <SafeArea
      style={{
        paddingLeft: SAFE_LEFT,
        paddingRight: RIGHT_SAFE,
      }}
    >
      <div style={{ height: "100%", position: "relative" }}>
        <div
          style={{
            left: -72,
            opacity: 0.88,
            position: "absolute",
            right: 0,
            top: -52,
            transform: "scale(0.82)",
            transformOrigin: "left top",
          }}
        >
          <BrandBug props={props} />
        </div>

        {kicker ? (
          <div
            style={{
              opacity: hookOpacity,
              position: "absolute",
              right: 4,
              top: 28,
            }}
          >
            <StickerChip
              background={theme.accent}
              color={theme.background}
              rotationDeg={5}
              startFrame={0}
              style={{
                fontSize: 28,
                padding: "15px 21px",
              }}
            >
              {kicker}
            </StickerChip>
          </div>
        ) : null}

        <div
          style={{
            height: 256,
            left: 0,
            opacity: hookOpacity,
            position: "absolute",
            right: 0,
            top: 118,
          }}
        >
          <WordCaptions
            color={theme.foreground}
            fontFamily={ARCHIVO_BLACK_FONT_FAMILY}
            fontSize={hookFontSize(props.title)}
            holdLastPageUntilFrame={HOOK_END_FRAME}
            highlightColor={theme.accent}
            maxLines={2}
            showScrim
            startFrame={0}
            text={props.title}
            wordsPerSecond={HOOK_WORDS_PER_SECOND}
          />
        </div>
      </div>
    </SafeArea>
  );
}

export function Slideshow(inputProps: RemotionProps) {
  useRemotionFonts();

  const props = parseCompositionProps(inputProps, "slideshow");
  const slideshow = props.slideshow;

  if (!slideshow) {
    throw new Error("Slideshow props are missing.");
  }

  const theme = themeOrDefault(props.theme);
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const slideDurationInFrames = Math.max(
    1,
    durationInFrames - HOOK_HOLD_UNTIL_FRAME,
  );
  const { timings, transitionDuration } = useMemo(
    () =>
      buildSlideTimings({
        durationInFrames: slideDurationInFrames,
        fps,
        musicSrc: props.music?.src,
        slideCount: slideshow.slides.length,
      }),
    [fps, props.music?.src, slideDurationInFrames, slideshow.slides.length],
  );
  const transitionTiming = useMemo(
    () =>
      linearTiming({
        durationInFrames: transitionDuration,
        easing: Easing.out(Easing.quad),
      }),
    [transitionDuration],
  );
  const slideFrame = Math.max(0, frame - HOOK_HOLD_UNTIL_FRAME);
  const activeIndex = getActiveSlideIndex(timings, slideFrame);

  return (
    <AbsoluteFill
      style={{
        background: theme.background,
        color: theme.foreground,
        fontFamily: REMOTION_FONT_STACK,
        overflow: "hidden",
      }}
    >
      <BackgroundWash theme={theme} />
      <Audio
        loop
        src={resolveAudioSrc(props.music?.src)}
        volume={props.music?.volume ?? 0.08}
      />

      <Sequence
        durationInFrames={slideDurationInFrames}
        from={HOOK_HOLD_UNTIL_FRAME}
        premountFor={fps}
      >
        <TransitionSeries>
          {slideshow.slides.map((currentSlide, index) => (
            <Fragment key={`${currentSlide.caption}-${index}`}>
              {index > 0 ? (
                <TransitionSeries.Transition
                  presentation={transitionPresentation(index)}
                  timing={transitionTiming}
                />
              ) : null}
              <TransitionSeries.Sequence
                durationInFrames={timings[index].sequenceDuration}
                premountFor={fps}
              >
                <SlideScene
                  index={index}
                  slide={currentSlide}
                  theme={theme}
                  timing={timings[index]}
                />
              </TransitionSeries.Sequence>
            </Fragment>
          ))}
        </TransitionSeries>
      </Sequence>

      <GrainOverlay opacity={0.045} size={210} />
      <HookOverlay kicker={slideshow.kicker} props={props} theme={theme} />

      <SafeArea
        style={{
          paddingLeft: SAFE_LEFT,
          paddingRight: RIGHT_SAFE,
        }}
      >
        <CaptionRow caption={props.caption} theme={theme} />
        <HashtagRow hashtags={props.hashtags} theme={theme} />
        <ProgressSegments
          activeIndex={activeIndex}
          frame={slideFrame}
          theme={theme}
          timings={timings}
        />
      </SafeArea>
    </AbsoluteFill>
  );
}
