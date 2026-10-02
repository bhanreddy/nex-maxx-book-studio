"use client";

import { useBlockContentFit } from "./useBlockContentFit";
import React, { useMemo, useRef, useState } from "react";
import type { SmartBlockInstance } from "../../domain/educational/blockSchema";
import { useEditorStore } from "../stores/editorStore";
import {
  learningOutcomeTopics,
  createLearningOutcomeTopic,
  addEmptySpaces,
  moveLearningOutcomeTopic,
  LEARNING_OUTCOMES_PALETTE,
  LEARNING_OUTCOMES_ICONS,
  getSubjectOutcomeDefault,
  SUBJECT_OUTCOME_DEFAULTS,
  type LearningOutcomeTopic,
  type LearningOutcomeIcon,
} from "../curriculum/learningOutcomes";
import { Trash2, Plus, ArrowUp, ArrowDown, Sparkles, BookOpen, Layers } from "lucide-react";

interface Props {
  block: SmartBlockInstance;
  selected?: boolean;
  locked?: boolean;
  elementId?: string;
}

/**
 * High-fidelity vector icon renderer for the diamond badges
 */
export function OutcomeBadgeIcon({ icon, size = 13 }: { icon: string; size?: number }) {
  switch (icon) {
    case "pencil":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
          <path d="m15 5 4 4" />
        </svg>
      );
    case "book":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      );
    case "code":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      );
    case "chart":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      );
    case "calculator":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="2" width="16" height="20" rx="3" />
          <line x1="8" y1="6" x2="16" y2="6" />
          <line x1="8" y1="11" x2="10" y2="11" />
          <line x1="14" y1="11" x2="16" y2="11" />
          <line x1="8" y1="15" x2="10" y2="15" />
          <line x1="14" y1="15" x2="16" y2="15" />
        </svg>
      );
    case "temple":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 20h20" />
          <path d="M4 20V10" />
          <path d="M9 20V10" />
          <path d="M15 20V10" />
          <path d="M20 20V10" />
          <path d="M12 2 2 8h20z" />
        </svg>
      );
    case "leaf":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
          <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
        </svg>
      );
    case "flask":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 2v5.5L4.4 18.2A2 2 0 0 0 6.1 21h11.8a2 2 0 0 0 1.7-2.8L14 7.5V2" />
          <line x1="8.5" y1="2" x2="15.5" y2="2" />
          <line x1="6.8" y1="15" x2="17.2" y2="15" />
        </svg>
      );
    case "globe":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      );
    case "computer":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      );
    case "lightbulb":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18h6" />
          <path d="M10 22h4" />
          <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5.76.76 1.23 1.52 1.41 2.5" />
        </svg>
      );
    case "palette":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
          <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
          <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
          <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
          <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.563-2.512 5.563-5.563C22 6.5 17.5 2 12 2z" />
        </svg>
      );
    case "speech":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      );
    case "music":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
      );
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      );
  }
}

/**
 * Pure SVG vector illustration of the stack of books with glowing lightbulb,
 * foliage, and soaring paper airplane, matching the reference image.
 */
export function LearningOutcomesArtwork() {
  return (
    <svg
      viewBox="0 0 240 260"
      className="w-full h-full select-none pointer-events-none drop-shadow-md"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Glowing bulb aura */}
        <radialGradient id="bulbGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="40%" stopColor="#c3dcff" stopOpacity="0.75" />
          <stop offset="80%" stopColor="#8cb7f2" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#649fe8" stopOpacity="0" />
        </radialGradient>
        {/* Soft bulb body */}
        <radialGradient id="bulbBody" cx="45%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="55%" stopColor="#d5e8ff" />
          <stop offset="100%" stopColor="#9cc5f6" />
        </radialGradient>
        {/* Book cover gradients */}
        <linearGradient id="bookBlue" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#5388c8" />
          <stop offset="100%" stopColor="#305a96" />
        </linearGradient>
        <linearGradient id="bookPurple" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a35487" />
          <stop offset="100%" stopColor="#6c3359" />
        </linearGradient>
        <linearGradient id="bookGreen" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#559976" />
          <stop offset="100%" stopColor="#35694f" />
        </linearGradient>
        {/* Pages gradient */}
        <linearGradient id="pagesGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#fdfbf7" />
          <stop offset="100%" stopColor="#ebe4d8" />
        </linearGradient>
        {/* Paper airplane */}
        <linearGradient id="planeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#b6c2e8" />
        </linearGradient>
      </defs>

      {/* Background Soft Floating Dot Matrix & Clouds */}
      <g opacity="0.35">
        <circle cx="150" cy="90" r="2.5" fill="#7588b5" />
        <circle cx="165" cy="90" r="2.5" fill="#7588b5" />
        <circle cx="180" cy="90" r="2.5" fill="#7588b5" />
        <circle cx="150" cy="105" r="2.5" fill="#7588b5" />
        <circle cx="165" cy="105" r="2.5" fill="#7588b5" />
        <circle cx="180" cy="105" r="2.5" fill="#7588b5" />
        <circle cx="150" cy="120" r="2.5" fill="#7588b5" />
        <circle cx="165" cy="120" r="2.5" fill="#7588b5" />
        <circle cx="180" cy="120" r="2.5" fill="#7588b5" />
      </g>

      {/* Botanical Leaves Behind Books */}
      <g opacity="0.9">
        <path
          d="M205 185 C 220 160, 235 150, 238 135 C 225 142, 212 155, 205 170 Z"
          fill="#5b9d75"
        />
        <path
          d="M195 190 C 215 175, 230 170, 235 160 C 220 168, 208 178, 195 185 Z"
          fill="#47805d"
        />
        <path
          d="M210 195 C 228 185, 238 182, 242 175 C 230 182, 220 188, 208 192 Z"
          fill="#6ab587"
        />
      </g>

      {/* BOTTOM BOOK: Forest Green */}
      <g id="bottom-book">
        {/* Soft book shadow */}
        <ellipse cx="140" cy="235" rx="75" ry="12" fill="#2d3f66" opacity="0.16" />
        {/* Spine and bottom edge */}
        <path
          d="M 68 206 C 65 210, 65 220, 68 226 L 195 240 C 205 241, 212 236, 215 228 L 215 214 Z"
          fill="url(#bookGreen)"
        />
        {/* Pages block */}
        <path
          d="M 78 208 L 198 221 C 205 222, 208 220, 210 216 L 210 228 C 208 232, 204 233, 196 232 L 78 220 Z"
          fill="url(#pagesGrad)"
          stroke="#d2c9bc"
          strokeWidth="0.8"
        />
        {/* Page lines */}
        <line x1="86" y1="213" x2="198" y2="225" stroke="#ded6c8" strokeWidth="0.8" />
        <line x1="86" y1="216" x2="198" y2="228" stroke="#ded6c8" strokeWidth="0.8" />
        {/* Top cover surface */}
        <path
          d="M 68 206 C 70 203, 76 203, 82 204 L 202 216 C 210 217, 213 220, 213 223 L 198 223 C 192 222, 75 208, 68 206 Z"
          fill="#68b48c"
        />
        {/* Curved spine badge */}
        <path
          d="M 68 206 C 63 212, 63 221, 68 226 C 72 226, 74 222, 74 216 C 74 210, 72 206, 68 206 Z"
          fill="#3b7255"
        />
      </g>

      {/* MIDDLE BOOK: Violet / Magenta */}
      <g id="middle-book">
        {/* Cover body */}
        <path
          d="M 72 178 C 68 183, 68 193, 72 199 L 200 212 C 210 213, 216 208, 218 200 L 218 188 Z"
          fill="url(#bookPurple)"
        />
        {/* Pages block */}
        <path
          d="M 82 181 L 202 193 C 208 194, 212 192, 214 188 L 214 200 C 212 204, 207 205, 200 204 L 82 192 Z"
          fill="url(#pagesGrad)"
          stroke="#d2c9bc"
          strokeWidth="0.8"
        />
        <line x1="88" y1="185" x2="202" y2="197" stroke="#ded6c8" strokeWidth="0.8" />
        <line x1="88" y1="188" x2="202" y2="200" stroke="#ded6c8" strokeWidth="0.8" />
        {/* Top cover surface */}
        <path
          d="M 72 178 C 75 175, 80 175, 86 176 L 205 188 C 212 189, 216 193, 216 195 L 202 195 C 195 194, 78 180, 72 178 Z"
          fill="#be68a0"
        />
        {/* Spine curve */}
        <path
          d="M 72 178 C 67 184, 67 193, 72 199 C 76 199, 78 195, 78 189 C 78 183, 76 178, 72 178 Z"
          fill="#522442"
        />
      </g>

      {/* TOP BOOK: Cobalt Blue */}
      <g id="top-book">
        {/* Cover body */}
        <path
          d="M 78 152 C 74 157, 74 167, 78 173 L 206 186 C 216 187, 222 182, 224 174 L 224 162 Z"
          fill="url(#bookBlue)"
        />
        {/* Pages block */}
        <path
          d="M 88 154 L 208 166 C 214 167, 218 165, 220 161 L 220 173 C 218 177, 213 178, 206 177 L 88 165 Z"
          fill="url(#pagesGrad)"
          stroke="#d2c9bc"
          strokeWidth="0.8"
        />
        <line x1="94" y1="158" x2="208" y2="170" stroke="#ded6c8" strokeWidth="0.8" />
        <line x1="94" y1="161" x2="208" y2="173" stroke="#ded6c8" strokeWidth="0.8" />
        {/* Top cover surface */}
        <path
          d="M 78 152 C 81 149, 86 149, 92 150 L 212 162 C 219 163, 223 167, 223 169 L 208 169 C 201 168, 84 154, 78 152 Z"
          fill="#6aa5eb"
        />
        {/* Curved spine */}
        <path
          d="M 78 152 C 73 158, 73 167, 78 173 C 82 173, 84 169, 84 163 C 84 157, 82 152, 78 152 Z"
          fill="#254779"
        />
        {/* Spine decorative accent band */}
        <path d="M 80 156 C 76 160, 76 165, 80 169" stroke="#9bc5fa" strokeWidth="1.5" strokeLinecap="round" />
      </g>

      {/* GLOWING LIGHTBULB */}
      <g id="lightbulb" transform="translate(145, 80)">
        {/* Large radiant background glow */}
        <circle cx="28" cy="40" r="56" fill="url(#bulbGlow)" />

        {/* Radiating sparkles & rays */}
        <g stroke="#396fb3" strokeWidth="1.8" strokeLinecap="round" opacity="0.85">
          <line x1="28" y1="-8" x2="28" y2="-2" />
          <line x1="62" y1="6" x2="57" y2="11" />
          <line x1="74" y1="36" x2="68" y2="36" />
          <line x1="-8" y1="36" x2="-2" y2="36" />
          <line x1="4" y1="12" x2="9" y2="16" />
        </g>

        {/* Tiny star sparkles */}
        <path d="M 52 14 Q 54 18 58 20 Q 54 22 52 26 Q 50 22 46 20 Q 50 18 52 14 Z" fill="#6ba7f2" />
        <path d="M 6 22 Q 8 25 11 26 Q 8 27 6 30 Q 5 27 2 26 Q 5 25 6 22 Z" fill="#88bdf9" />

        {/* Screw Base of the bulb */}
        <g id="screw-base">
          <rect x="23" y="55" width="10" height="4" rx="2" fill="#8199b9" />
          <rect x="24" y="59" width="8" height="3" rx="1.5" fill="#637c9d" />
          <path d="M 25 62 Q 28 66 31 62" stroke="#48607e" strokeWidth="1.5" fill="none" />
        </g>

        {/* Bulb Glass Body */}
        <path
          d="M 28 12 C 16 12, 10 22, 10 32 C 10 39, 14 44, 18 48 C 21 51, 22 55, 23 56 L 33 56 C 34 55, 35 51, 38 48 C 42 44, 46 39, 46 32 C 46 22, 40 12, 28 12 Z"
          fill="url(#bulbBody)"
          stroke="#4076ba"
          strokeWidth="2.2"
        />

        {/* Bulb Inner Filament (Tungsten wire) */}
        <path
          d="M 24 54 L 24 38 L 26 34 L 28 36 L 30 34 L 32 38 L 32 54"
          stroke="#264c80"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Glass specular highlight shine */}
        <path
          d="M 16 22 C 19 16, 26 15, 32 16"
          stroke="#ffffff"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="36" cy="20" r="1.5" fill="#ffffff" />
      </g>

      {/* FLYING PAPER AIRPLANE */}
      <g id="paper-plane" transform="translate(180, 20)">
        {/* Dotted Flight Contrail Arc */}
        <path
          d="M -30 110 C -10 95, 0 70, 10 40 C 15 25, 22 15, 30 10"
          stroke="#889ec8"
          strokeWidth="1.8"
          strokeDasharray="4 4"
          strokeLinecap="round"
          fill="none"
        />

        {/* Faceted Airplane Body */}
        <g transform="rotate(-15, 25, 25)">
          {/* Main top wing */}
          <polygon points="10,35 48,5 28,45" fill="url(#planeGrad)" stroke="#6d81b3" strokeWidth="1" />
          {/* Under body facet */}
          <polygon points="28,45 48,5 22,48" fill="#8fa5d6" stroke="#6d81b3" strokeWidth="1" />
          {/* Left folded facet */}
          <polygon points="10,35 48,5 22,48" fill="#c3d2f2" stroke="#6d81b3" strokeWidth="1" />
        </g>
      </g>
    </svg>
  );
}

export function LearningOutcomesRenderer({
  block,
  selected = false,
  locked = false,
  elementId = block.id,
}: Props) {
  const updateSmartBlockContent = useEditorStore((s) => s.updateSmartBlockContent);
  const content = block.semanticContent || {};
  const subject = block.curriculum?.subjectLabel || block.subject || "Maths";

  const topics = useMemo(() => learningOutcomeTopics(block), [block]);
  const title = content.title || "LEARNING OUTCOMES";
  const subtitle = content.calloutText || content.subtitle || getSubjectOutcomeDefault(subject).intro;

  const [editingTitle, setEditingTitle] = useState(false);
  const [editingSubtitle, setEditingSubtitle] = useState(false);
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [activeIconPicker, setActiveIconPicker] = useState<string | null>(null);
  const [showSubjectMenu, setShowSubjectMenu] = useState(false);

  const titleDraft = useRef(title);
  const subtitleDraft = useRef(subtitle);
  const topicDraftVerb = useRef("");
  const topicDraftText = useRef("");

  const cardRef = useBlockContentFit(block, elementId, locked);
  const canEdit = !locked && !block.isLockedContent;

  const commitContent = (patch: Partial<SmartBlockInstance["semanticContent"]>) => {
    updateSmartBlockContent(elementId, patch);
  };

  const updateTopics = (nextTopics: LearningOutcomeTopic[]) => {
    commitContent({
      learningOutcomeTopics: nextTopics,
      items: nextTopics.map((t) =>
        t.isEmpty ? "" : t.verb ? `${t.verb} ${t.text}`.trim() : t.text
      ),
    });
  };

  const handleTitleCommit = () => {
    setEditingTitle(false);
    if (titleDraft.current.trim() && titleDraft.current !== title) {
      commitContent({ title: titleDraft.current.trim() });
    }
  };

  const handleSubtitleCommit = () => {
    setEditingSubtitle(false);
    if (subtitleDraft.current.trim() && subtitleDraft.current !== subtitle) {
      commitContent({ calloutText: subtitleDraft.current.trim(), subtitle: subtitleDraft.current.trim() });
    }
  };

  const handleTopicCommit = (topicId: string) => {
    setEditingTopicId(null);
    const updated = topics.map((t) => {
      if (t.id === topicId) {
        return {
          ...t,
          verb: topicDraftVerb.current.trim(),
          text: topicDraftText.current.trim(),
          isEmpty: !topicDraftVerb.current.trim() && !topicDraftText.current.trim(),
        };
      }
      return t;
    });
    updateTopics(updated);
  };

  const handleAddTopic = () => {
    const next = [
      ...topics,
      createLearningOutcomeTopic("apply", "new concepts in practical exercises", topics.length, subject, false),
    ];
    updateTopics(next);
  };

  const handleAddEmptySpaces = (count: number = 3) => {
    const next = addEmptySpaces(topics, count, subject);
    updateTopics(next);
  };

  const handleDeleteTopic = (topicId: string) => {
    const next = topics.filter((t) => t.id !== topicId);
    updateTopics(next);
  };

  const handleMoveTopic = (topicId: string, direction: -1 | 1) => {
    const next = moveLearningOutcomeTopic(topics, topicId, direction);
    updateTopics(next);
  };

  const handleApplySubjectPreset = (subKey: string) => {
    const def = SUBJECT_OUTCOME_DEFAULTS[subKey] || SUBJECT_OUTCOME_DEFAULTS.Maths;
    const next = def.outcomes.map((item, idx) =>
      createLearningOutcomeTopic(item.verb, item.text, idx, subKey, false, item.icon)
    );
    commitContent({
      title: "LEARNING OUTCOMES",
      calloutText: def.intro,
      subtitle: def.intro,
      learningOutcomeTopics: next,
      items: next.map((t) => `${t.verb} ${t.text}`.trim()),
    });
    setShowSubjectMenu(false);
  };

  // Determine if split into 2 columns (e.g. if topic count > 7 or container is wide)
  const isTwoColumn = topics.length > 8 && block.transform.width > 600;

  return (
    <div
      className="relative w-full h-full font-sans select-text box-border"
      ref={cardRef}
      data-learning-outcomes="true"
      style={{
        minHeight: "100%",
      }}
    >
      {/* OUTER CARD CONTAINER */}
      <div
        className="relative w-full h-full rounded-[28px] p-5 sm:p-7 md:p-8 flex flex-col justify-between overflow-hidden transition-all duration-200"
        style={{
          background: "linear-gradient(135deg, #f5f8fe 0%, #ffffff 45%, #eff4fc 100%)",
          border: "2px solid #b8cae8",
          boxShadow: "0 12px 36px -4px rgba(40, 60, 115, 0.12), inset 0 1px 3px rgba(255,255,255,0.9)",
        }}
      >
        {/* Soft Background Cloud Accent */}
        <div
          aria-hidden="true"
          className="absolute -top-10 -right-10 w-72 h-72 rounded-full pointer-events-none opacity-40 blur-3xl"
          style={{ background: "radial-gradient(circle, #c9dcfe 0%, rgba(201, 220, 254, 0) 70%)" }}
        />

        {/* TOP HEADER ROW */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            {/* 3D Pill Banner with Target Icon and Title */}
            <div className="relative inline-flex items-center">
              {/* Offset lower shadow layer for authentic 3D depth */}
              <div
                className="absolute inset-0 rounded-full translate-y-1 translate-x-0.5 opacity-90"
                style={{ background: "linear-gradient(180deg, #373359 0%, #201e38 100%)" }}
              />

              {/* Main Pill Surface */}
              <div
                className="relative flex items-center gap-2.5 rounded-full pl-1.5 pr-6 py-1.5 text-white shadow-md"
                style={{
                  background: "linear-gradient(180deg, #384572 0%, #1f274a 100%)",
                  border: "1px solid rgba(255, 255, 255, 0.22)",
                }}
              >
                {/* Target / Bullseye Badge */}
                <div
                  className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#2a3663] shadow-sm shrink-0"
                  style={{
                    border: "2px solid #b2c9ef",
                    background: "radial-gradient(circle at 35% 35%, #ffffff 0%, #e8f0fe 100%)",
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    {/* Concentric rings */}
                    <circle cx="12" cy="12" r="9.5" stroke="#253565" strokeWidth="2" />
                    <circle cx="12" cy="12" r="5.5" stroke="#253565" strokeWidth="1.8" />
                    <circle cx="12" cy="12" r="2" fill="#253565" />
                    {/* Radiating sparkles top-left */}
                    <line x1="4" y1="4" x2="2" y2="2" stroke="#253565" strokeWidth="2" strokeLinecap="round" />
                    <line x1="8" y1="2" x2="8" y2="0.5" stroke="#253565" strokeWidth="2" strokeLinecap="round" />
                    <line x1="2" y1="8" x2="0.5" y2="8" stroke="#253565" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>

                {/* Banner Text (LEARNING OUTCOMES) */}
                {editingTitle && canEdit ? (
                  <input
                    autoFocus
                    defaultValue={title}
                    onChange={(e) => {
                      titleDraft.current = e.target.value;
                    }}
                    onBlur={handleTitleCommit}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleTitleCommit();
                      if (e.key === "Escape") setEditingTitle(false);
                    }}
                    className="bg-white/20 text-white font-black text-sm tracking-wider uppercase px-2 py-0.5 rounded outline-none"
                  />
                ) : (
                  <h2
                    onDoubleClick={() => canEdit && setEditingTitle(true)}
                    className="font-black text-sm sm:text-base tracking-wide uppercase select-none cursor-pointer flex items-center gap-1.5"
                    title={canEdit ? "Double-click to edit heading" : undefined}
                  >
                    <span>{title.split(" ")[0] || "LEARNING"}</span>
                    <span style={{ color: "#f2b5e2" }}>
                      {title.split(" ").slice(1).join(" ") || "OUTCOMES"}
                    </span>
                  </h2>
                )}
              </div>
            </div>

            {/* Decorative accent lines and dashes */}
            <div className="hidden sm:flex items-center gap-1.5 opacity-60">
              <span className="w-1.5 h-4 rounded-full bg-[#aabde0] rotate-12" />
              <span className="w-1.5 h-4 rounded-full bg-[#aabde0] rotate-12" />
              <span className="w-1.5 h-4 rounded-full bg-[#aabde0] rotate-12" />
              <span className="w-16 h-0.5 bg-[#aabde0] ml-1" />
              <span className="w-2 h-2 rounded-full bg-[#aabde0]" />
            </div>
          </div>

          {/* Quick Subject & Action Switcher in top right */}
          {canEdit && (
            <div className="relative flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowSubjectMenu(!showSubjectMenu)}
                className="text-[11px] font-bold text-[#324578] hover:text-[#182a55] bg-white/80 hover:bg-white border border-[#b8c9e8] rounded-lg px-2.5 py-1 flex items-center gap-1.5 shadow-2xs transition"
                title="Switch subject templates"
              >
                <BookOpen size={12} />
                <span>{subject}</span>
              </button>

              {/* Subject Presets Dropdown */}
              {showSubjectMenu && (
                <div
                  className="absolute right-0 top-8 z-30 w-48 bg-white border border-[#b8c9e8] rounded-xl shadow-xl p-1.5 text-xs text-[#202b48] space-y-1 animate-in fade-in"
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Apply Subject Starters:
                  </div>
                  {Object.keys(SUBJECT_OUTCOME_DEFAULTS).map((subKey) => (
                    <button
                      key={subKey}
                      type="button"
                      onClick={() => handleApplySubjectPreset(subKey)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between hover:bg-[#edf3ff] transition ${
                        subKey.toLowerCase() === subject.toLowerCase() ? "font-bold text-indigo-700 bg-indigo-50" : ""
                      }`}
                    >
                      <span>{subKey}</span>
                      {subKey.toLowerCase() === subject.toLowerCase() && <span className="text-[10px]">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* SUBTITLE / PROMPT LINE */}
        <div className="relative z-10 mb-5">
          {editingSubtitle && canEdit ? (
            <textarea
              autoFocus
              rows={2}
              defaultValue={subtitle}
              onChange={(e) => {
                subtitleDraft.current = e.target.value;
              }}
              onBlur={handleSubtitleCommit}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubtitleCommit();
                }
                if (e.key === "Escape") setEditingSubtitle(false);
              }}
              className="w-full text-sm sm:text-base font-extrabold text-[#17254f] bg-white border-2 border-indigo-400 rounded-lg p-2 outline-none"
            />
          ) : (
            <p
              onDoubleClick={() => canEdit && setEditingSubtitle(true)}
              className="text-sm sm:text-base font-extrabold text-[#182650] leading-snug cursor-pointer select-none hover:text-indigo-900 transition"
              title={canEdit ? "Double-click to edit intro prompt" : undefined}
            >
              {subtitle}
            </p>
          )}
        </div>

        {/* MAIN BODY: Outcome Rows on Left, Vector Artwork on Right */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch flex-1 min-h-0">
          {/* OUTCOME ROWS LIST */}
          <div className={`${isTwoColumn ? "lg:col-span-8" : "lg:col-span-8"} flex-1 flex flex-col justify-between min-h-0`}>
            <div className={`grid ${isTwoColumn ? "grid-cols-1 md:grid-cols-2 gap-x-4" : "grid-cols-1"} gap-y-2.5 flex-1 min-h-0`}>
              {topics.map((topic, index) => {
                const isEditing = editingTopicId === topic.id;
                const isColorPickerOpen = activeIconPicker === topic.id;

                return (
                  <div
                    key={topic.id}
                    className={`group relative flex items-start gap-3 py-1.5 border-b border-dashed border-[#ccd9f0] last:border-b-0 hover:bg-white/40 rounded-lg px-2 transition-colors ${
                      topic.isEmpty ? "flex-1 min-h-[44pt]" : ""
                    }`}
                  >
                    {/* DIAMOND ICON BADGE */}
                    <div className="relative shrink-0 pt-0.5">
                      <button
                        type="button"
                        onClick={() => canEdit && setActiveIconPicker(isColorPickerOpen ? null : topic.id)}
                        className="w-7 h-7 flex items-center justify-center transition-transform hover:scale-110 active:scale-95 cursor-pointer shadow-xs"
                        style={{
                          transform: "rotate(45deg)",
                          backgroundColor: topic.color || LEARNING_OUTCOMES_PALETTE[index % LEARNING_OUTCOMES_PALETTE.length],
                          borderRadius: "7px",
                        }}
                        title={canEdit ? "Click to change icon or color" : undefined}
                      >
                        {/* Un-rotate the icon inside so it stands upright */}
                        <span style={{ transform: "rotate(-45deg)", color: "#ffffff" }} className="flex items-center justify-center">
                          <OutcomeBadgeIcon icon={topic.icon} size={14} />
                        </span>
                      </button>

                      {/* ICON & COLOR PICKER POPOVER */}
                      {isColorPickerOpen && canEdit && (
                        <div
                          className="absolute left-0 top-10 z-40 w-52 bg-white border border-[#b8c9e8] rounded-xl shadow-xl p-3 text-xs space-y-2.5 animate-in fade-in"
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Pick Icon:</div>
                          <div className="grid grid-cols-5 gap-1.5">
                            {LEARNING_OUTCOMES_ICONS.map((ic) => (
                              <button
                                key={ic}
                                type="button"
                                onClick={() => {
                                  const updated = topics.map((t) => (t.id === topic.id ? { ...t, icon: ic } : t));
                                  updateTopics(updated);
                                  setActiveIconPicker(null);
                                }}
                                className={`w-7 h-7 rounded-lg flex items-center justify-center transition ${
                                  topic.icon === ic ? "bg-indigo-600 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                                }`}
                                title={ic}
                              >
                                <OutcomeBadgeIcon icon={ic} size={13} />
                              </button>
                            ))}
                          </div>

                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 pt-1 border-t border-slate-100">
                            Pick Color:
                          </div>
                          <div className="grid grid-cols-5 gap-1.5">
                            {LEARNING_OUTCOMES_PALETTE.map((c) => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => {
                                  const updated = topics.map((t) => (t.id === topic.id ? { ...t, color: c } : t));
                                  updateTopics(updated);
                                  setActiveIconPicker(null);
                                }}
                                className={`w-6 h-6 rounded-full transition-transform hover:scale-115 ${
                                  topic.color === c ? "ring-2 ring-offset-1 ring-slate-800 scale-105" : ""
                                }`}
                                style={{ backgroundColor: c }}
                                title={c}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* TEXT CONTENT (ACTION VERB + DESCRIPTION / EMPTY SPACE) */}
                    <div className="flex-1 min-w-0 pt-0.5">
                      {isEditing && canEdit ? (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <input
                              autoFocus
                              placeholder="Action verb (e.g. write, identify)"
                              defaultValue={topic.verb}
                              onChange={(e) => {
                                topicDraftVerb.current = e.target.value;
                              }}
                              className="w-28 text-xs font-black uppercase px-2 py-1 bg-white border border-indigo-300 rounded shadow-xs"
                            />
                            <input
                              placeholder="Outcome description..."
                              defaultValue={topic.text}
                              onChange={(e) => {
                                topicDraftText.current = e.target.value;
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleTopicCommit(topic.id);
                                if (e.key === "Escape") setEditingTopicId(null);
                              }}
                              className="flex-1 text-xs font-medium px-2 py-1 bg-white border border-indigo-300 rounded shadow-xs"
                            />
                          </div>
                          <div className="flex gap-2 justify-end">
                            <button
                              type="button"
                              onClick={() => setEditingTopicId(null)}
                              className="text-[10px] text-slate-500 hover:text-slate-700 px-2 py-0.5"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleTopicCommit(topic.id)}
                              className="text-[10px] bg-indigo-600 text-white font-bold rounded px-2.5 py-0.5 hover:bg-indigo-700"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : topic.isEmpty ? (
                        /* EMPTY WRITE-IN SPACE THAT EXPANDS INTO THE ROW */
                        <div
                          onDoubleClick={() => {
                            if (!canEdit) return;
                            topicDraftVerb.current = topic.verb;
                            topicDraftText.current = topic.text;
                            setEditingTopicId(topic.id);
                          }}
                          style={{ minHeight: "36pt" }}
                          className="w-full flex-1 border-2 border-dashed border-[#b8c9e8] bg-white/60 hover:bg-white rounded-xl flex items-center justify-between cursor-pointer px-3 py-2 group/empty transition-all shadow-2xs"
                          title={canEdit ? "Double-click to write in this empty space" : undefined}
                        >
                          <span className="text-xs sm:text-sm italic text-[#7088b2] group-hover/empty:text-indigo-600 font-medium">
                            {topic.text || "[Blank space for custom student/teacher outcome...]"}
                          </span>
                        </div>
                      ) : (
                        /* STANDARD OUTCOME ROW */
                        <p
                          onDoubleClick={() => {
                            if (!canEdit) return;
                            topicDraftVerb.current = topic.verb;
                            topicDraftText.current = topic.text;
                            setEditingTopicId(topic.id);
                          }}
                          className="text-xs sm:text-sm text-[#1e2a4a] leading-relaxed cursor-pointer select-none"
                          title={canEdit ? "Double-click to edit outcome" : undefined}
                        >
                          {topic.verb && (
                            <strong
                              className="font-black mr-1.5 transition-colors"
                              style={{ color: topic.color || "#1e2a4a" }}
                            >
                              {topic.verb}
                            </strong>
                          )}
                          <span className="font-medium text-[#2d395a]">{topic.text}</span>
                        </p>
                      )}
                    </div>

                    {/* ROW ACTIONS (MOVE / DELETE) */}
                    {canEdit && (
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity pt-0.5">
                        <button
                          type="button"
                          onClick={() => handleMoveTopic(topic.id, -1)}
                          disabled={index === 0}
                          className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-20"
                          title="Move up"
                        >
                          <ArrowUp size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveTopic(topic.id, 1)}
                          disabled={index === topics.length - 1}
                          className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-20"
                          title="Move down"
                        >
                          <ArrowDown size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTopic(topic.id)}
                          className="p-1 text-slate-400 hover:text-rose-600"
                          title="Delete topic"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* QUICK ACTIONS FOR ADDING OUTCOMES & EMPTY SPACES */}
            {canEdit && (
              <div className="pt-2 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddTopic}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100/90 border border-indigo-200 shadow-2xs transition"
                >
                  <Plus size={13} />
                  <span>Add Outcome</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddEmptySpaces(1)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[#455c88] bg-white hover:bg-slate-50 border border-dashed border-[#b8c9e8] shadow-2xs transition"
                  title="Add an empty line for student/teacher custom writing"
                >
                  <Plus size={13} />
                  <span>+ 1 Empty Space</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddEmptySpaces(3)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[#455c88] bg-white hover:bg-slate-50 border border-dashed border-[#b8c9e8] shadow-2xs transition"
                  title="Add 3 empty lines for student/teacher custom writing"
                >
                  <Layers size={13} />
                  <span>+ 3 Empty Spaces</span>
                </button>
              </div>
            )}
          </div>

          {/* RIGHT SIDE VECTOR ARTWORK */}
          <div className="lg:col-span-4 hidden sm:flex items-center justify-center p-2">
            <div className="w-full max-w-[220px] aspect-square">
              <LearningOutcomesArtwork />
            </div>
          </div>
        </div>

        {/* BOTTOM ACCENT: 5 PASTEL DOTS */}
        <div className="relative z-10 flex items-center gap-1.5 pt-3">
          <span className="w-2 h-2 rounded-full bg-[#b8cae8]" />
          <span className="w-2 h-2 rounded-full bg-[#b8cae8]" />
          <span className="w-2 h-2 rounded-full bg-[#b8cae8]" />
          <span className="w-2 h-2 rounded-full bg-[#b8cae8]" />
          <span className="w-2 h-2 rounded-full bg-[#b8cae8]" />
        </div>
      </div>
    </div>
  );
}
