import type { CharacterSpec } from 'wobnimo';

/**
 * Hoot, LitLens's scholar owl (v2, built with the wobnimo-mascot skill).
 *
 * Plan: a plump owl whose big head melts into its body; the signature is a
 * flat ultramarine mortarboard (the Proceedings colour) with a gold tassel
 * that swings on its own bone. Round navy glasses over big amber eyes, a pale
 * heart-shaped face, soft ear tufts that perk and droop, feathered wings that
 * hang like arms and flap, a cream breast.
 * Recolour live with `palette`, e.g. { cap: '#7d8bff' } (materials below).
 *
 * World heights (floor y = 0): body centre 0.36, head centre 0.70, cap ~1.08.
 */
export const owl: CharacterSpec = {
  id: 'owl',
  name: 'Hoot',
  tagline: 'A scholar owl who reads your papers, thinks it over and celebrates good citations',
  accent: '#2338c9',

  frame: { target: 0.6, radius: 0.72 },
  bound: { y: 0.6, radius: 0.8 },
  motion: { hop: 0.13, squash: 1.1, snap: 1.05, talkSquash: 0.5 },

  materials: {
    feather: { color: '#8b5a3a', f0: 0.03, spec: 0.22, shininess: 14, rim: 0.9, sheen: 0.55 },
    wing: { color: '#6a4128', shadeOf: 'feather', f0: 0.03, spec: 0.25, shininess: 16, rim: 0.8, sheen: 0.5 },
    beak: { color: '#e3a03a', f0: 0.05, spec: 1, shininess: 80, rim: 0.4, gloss: 0.6 },
    feet: { color: '#d9893a', shadeOf: 'beak', f0: 0.04, spec: 0.6, shininess: 40, rim: 0.3 },
    rims: { color: '#1b2350', f0: 0.06, spec: 1.6, shininess: 160, rim: 0.4, gloss: 0.8 },
    cap: { color: '#2338c9', f0: 0.06, spec: 1.4, shininess: 140, rim: 0.5, gloss: 0.7 },
    tassel: { color: '#e8b23a', f0: 0.03, spec: 0.5, shininess: 30, rim: 0.9, sheen: 0.7 },
  },

  bones: [
    { name: 'body', pivot: [0, 0, 0], drive: { ry: [['yaw', 0.25]], rz: [['roll', 0.3]], rx: [['pitch', -0.12]] } },
    // pitch kept gentle: tipping the head far forward swings the beak down into the chest
    { name: 'head', parent: 'body', pivot: [0, 0.56, 0], drive: { rx: [['pitch', -0.5]], ry: [['yaw', 0.8]], rz: [['roll', 0.7]] } },
    // the beak hinges at its top; a negative talk angle swings the tip forward, away from the face
    // Hinge sits on the face surface, below the glasses and forward of them, so the
    // rims never cover it when the head tips down (looking at the cursor, sad, asleep).
    { name: 'beak', parent: 'head', pivot: [0, 0.03, 0.335], drive: { rx: [['talk', -0.22]] } },
    { name: 'tuftL', parent: 'head', pivot: [-0.2, 0.36, 0.04], jiggle: { axis: [0, 1, 0], length: 0.12, freq: 2.6, damping: 0.14 } },
    { name: 'tuftR', parent: 'head', pivot: [0.2, 0.36, 0.04], jiggle: { axis: [0, 1, 0], length: 0.12, freq: 2.6, damping: 0.14 } },
    { name: 'tassel', parent: 'head', pivot: [0.22, 0.53, 0.08], jiggle: { axis: [0, -1, 0], length: 0.16, freq: 2.2, damping: 0.1, maxAngle: 0.7 } },
    {
      name: 'wingL', parent: 'body', pivot: [-0.33, 0.52, -0.02],
      drive: { rz: [['flap', -1.5]] }, wave: { rz: [0.04, 0.8, 0] },
      jiggle: { axis: [0, -1, 0], length: 0.28, freq: 3, damping: 0.3, maxAngle: 0.5 },
    },
    {
      name: 'wingR', parent: 'body', pivot: [0.33, 0.52, -0.02],
      drive: { rz: [['flap', 1.5]] }, wave: { rz: [-0.04, 0.8, 1.1] },
      jiggle: { axis: [0, -1, 0], length: 0.28, freq: 3, damping: 0.3, maxAngle: 0.5 },
    },
  ],

  parts: [
    /* plump body, then the big head melting into it */
    { bone: 'body', shape: 'ellipsoid', at: [0, 0.36, 0], radii: [0.36, 0.34, 0.33], material: 'feather' },
    { bone: 'head', shape: 'sphere', at: [0, 0.14, 0.02], radius: 0.33, blend: 0.16, material: 'feather' },
    /* soft ear tufts leaning out */
    { bone: 'tuftL', shape: 'roundCone', from: [0, -0.04, 0], to: [-0.07, 0.1, -0.01], r1: 0.06, r2: 0.022, blend: 0.04, material: 'feather' },
    { bone: 'tuftR', shape: 'roundCone', from: [0, -0.04, 0], to: [0.07, 0.1, -0.01], r1: 0.06, r2: 0.022, blend: 0.04, material: 'feather' },
    /* small hooked beak under the glasses, pointing mostly down: when the head
       tips forward it still reads as a beak instead of foreshortening to a dot */
    { bone: 'beak', shape: 'roundCone', from: [0, 0, 0], to: [0, -0.088, 0.034], r1: 0.044, r2: 0.013, material: 'beak' },
    /* round glasses: a ring in front of each eye and a bridge */
    { bone: 'head', shape: 'frame', at: [-0.13, 0.15, 0.335], rot: [0, -0.4, 0], half: [0.1, 0.1], corner: 0.1, width: 0.02, depth: 0.016, material: 'rims' },
    { bone: 'head', shape: 'frame', at: [0.13, 0.15, 0.335], rot: [0, 0.4, 0], half: [0.1, 0.1], corner: 0.1, width: 0.02, depth: 0.016, material: 'rims' },
    { bone: 'head', shape: 'capsule', at: [0, 0, 0.03], from: [-0.035, 0.17, 0.33], to: [0.035, 0.17, 0.33], radius: 0.015, material: 'rims' },
    /* mortarboard: a skull cap, a flat board tipped slightly toward the camera, a button */
    { bone: 'head', shape: 'cylinder', at: [0, 0.44, -0.01], radius: 0.18, half: 0.05, round: 0.03, material: 'cap' },
    { bone: 'head', shape: 'roundBox', at: [0, 0.51, -0.01], rot: [0.18, 0.6, 0], half: [0.25, 0.018, 0.25], round: 0.012, material: 'cap' },
    { bone: 'head', shape: 'sphere', at: [0, 0.535, -0.01], radius: 0.028, material: 'tassel' },
    /* the tassel cord and its hanging end (on the swinging tassel bone) */
    { bone: 'tassel', shape: 'capsule', from: [0, 0, 0], to: [0.01, -0.12, 0.01], radius: 0.012, material: 'tassel' },
    { bone: 'tassel', shape: 'roundCone', from: [0.01, -0.12, 0.01], to: [0.012, -0.19, 0.012], r1: 0.018, r2: 0.03, material: 'tassel' },
    /* wings hinge at the shoulder and lie against the body */
    { bone: 'wingL', shape: 'ellipsoid', at: [-0.02, -0.16, 0], rot: [0, 0, -0.16], radii: [0.08, 0.22, 0.19], blend: 0.02, material: 'wing' },
    { bone: 'wingR', shape: 'ellipsoid', at: [0.02, -0.16, 0], rot: [0, 0, 0.16], radii: [0.08, 0.22, 0.19], blend: 0.02, material: 'wing' },
    /* three toes a foot */
    { bone: 'root', shape: 'capsule', from: [-0.13, 0.03, 0.12], to: [-0.18, 0.025, 0.24], radius: 0.026, material: 'feet' },
    { bone: 'root', shape: 'capsule', from: [-0.13, 0.03, 0.12], to: [-0.1, 0.025, 0.25], radius: 0.026, material: 'feet' },
    { bone: 'root', shape: 'capsule', from: [-0.13, 0.03, 0.12], to: [-0.13, 0.06, 0.03], radius: 0.03, blend: 0.02, material: 'feet' },
    { bone: 'root', shape: 'capsule', from: [0.13, 0.03, 0.12], to: [0.18, 0.025, 0.24], radius: 0.026, material: 'feet' },
    { bone: 'root', shape: 'capsule', from: [0.13, 0.03, 0.12], to: [0.1, 0.025, 0.25], radius: 0.026, material: 'feet' },
    { bone: 'root', shape: 'capsule', from: [0.13, 0.03, 0.12], to: [0.13, 0.06, 0.03], radius: 0.03, blend: 0.02, material: 'feet' },
  ],

  paints: [
    /* cream breast */
    { bone: 'body', on: ['feather'], kind: 'ellipse', at: [0, 0.3, 0], radii: [0.25, 0.25], color: '#f1e2c8', soft: 0.12 },
    /* the pale heart-shaped facial disc: one soft patch around each eye */
    { bone: 'head', on: ['feather'], kind: 'sphere', at: [-0.13, 0.13, 0.29], radius: 0.14, color: '#f1e2c8', soft: 0.45, opacity: 0.9 },
    { bone: 'head', on: ['feather'], kind: 'sphere', at: [0.13, 0.13, 0.29], radius: 0.14, color: '#f1e2c8', soft: 0.45, opacity: 0.9 },
  ],

  eyes: {
    kind: 'ball',
    bone: 'head',
    at: [
      [-0.13, 0.15, 0.27],
      [0.13, 0.15, 0.27],
    ],
    radius: 0.08,
    iris: '#f2b84b',
    irisSize: 0.8,
    pupilSize: 0.5,
    lid: 'feather',
  },

  anchors: {
    top: { bone: 'head', at: [0.16, 0.58, 0.05] },
    mouth: { bone: 'head', at: [0, 0.02, 0.4] },
    ear: { bone: 'head', at: [-0.34, 0.16, 0] },
    feet: { bone: 'root', at: [0, 0.02, 0.12] },
    chest: { bone: 'body', at: [0, 0.4, 0.32] },
  },

  acting: {
    idle: { tassel: { rz: [0, 0.08, 0.6, 0] } },
    /* a wing tip to the chin, head tilted, tufts twitching */
    thinking: {
      wingR: { rz: 1.05, rx: -0.95, ry: -0.35 },
      head: { rz: 0.14 },
      tuftL: { rz: [0, 0.12, 1.4, 0] },
      tuftR: { rz: [0, -0.12, 1.4, 0] },
    },
    /* tufts up, head turned to listen */
    listening: { tuftL: { rz: -0.25 }, tuftR: { rz: 0.25 }, head: { rz: -0.1 }, wingL: { rz: -0.9, rx: -0.5 } },
    speaking: {
      head: { rx: [-0.1, 0.05, 1.1, 0] },
      wingL: { rz: [-0.16, 0.12, 2.3, 0] },
      wingR: { rz: [0.16, 0.12, 2.3, 1.2] },
    },
    /* reading: a slow nod over the work, wing tips turning pages (kept slow: fast loops look like glitches) */
    working: {
      head: { rx: [0.07, 0.03, 1.4, 0] },
      wingL: { rz: [-0.35, 0.1, 1.8, 0], rx: -0.5 },
      wingR: { rz: [0.35, 0.1, 1.8, Math.PI], rx: -0.5 },
    },
    error: { wingL: { rz: [-1.0, 0.1, 12, 0] }, wingR: { rz: [1.0, 0.1, 12, 1] }, tuftL: { rz: -0.35 }, tuftR: { rz: 0.35 } },
    surprised: { wingL: { rz: -1.6 }, wingR: { rz: 1.6 }, tuftL: { rz: -0.45 }, tuftR: { rz: 0.45 }, head: { rx: -0.12 } },
    celebrating: {
      wingL: { rz: [-1.4, 0.5, 9, 0] },
      wingR: { rz: [1.4, 0.5, 9, 0] },
      tuftL: { rz: [0, 0.2, 6, 0] },
      tuftR: { rz: [0, -0.2, 6, 0] },
    },
    /* everything droops */
    sad: { head: { rx: 0.1 }, tuftL: { rz: 0.55, rx: 0.4 }, tuftR: { rz: -0.55, rx: 0.4 }, wingL: { rz: 0.25 }, wingR: { rz: -0.25 } },
    sleeping: { head: { rx: 0.08 }, tuftL: { rz: 0.4 }, tuftR: { rz: -0.4 }, wingL: { ry: 0.5, rz: 0.12 }, wingR: { ry: -0.5, rz: -0.12 } },
    happy: { wingL: { rz: [-0.9, 0.7, 7, 0] }, wingR: { rz: [0.9, 0.7, 7, 0] }, tassel: { rz: [0, 0.4, 5, 0] } },
  },

  fx: {
    'enter:celebrating': [
      { glyph: 'confetti', anchor: 'top', rate: 14, spread: 0.25, velocity: [0, 0.8, 0.3], jitter: 1.2, gravity: 2.2, life: [0.7, 1.1], size: [0.025, 0.02], color: '#2338c9' },
      { glyph: 'confetti', anchor: 'top', rate: 10, spread: 0.25, velocity: [0, 0.8, 0.3], jitter: 1.2, gravity: 2.2, life: [0.7, 1.1], size: [0.025, 0.02], color: '#e8b23a' },
    ],
    'enter:happy': [
      { glyph: 'feather', anchor: 'chest', rate: 4, spread: 0.12, velocity: [0, 0.18, 0.12], jitter: 0.45, gravity: 0.12, drag: 1.4, wobble: 0.14, life: [1.8, 2.4], size: [0.05, 0.05], spin: 1.6, color: '#a8794f' },
    ],
  },
};

export default owl;
