import type { CharacterSpec } from 'wobnimo';
// explicit .ts: the wobnimo CLI loads this file with Node's TypeScript support
import { owl } from './owl.ts';

/**
 * Hoot perched on a branch (home page, wide screens). Same owl, plus a bark
 * branch under his feet that runs out to the right (the page edge crops it,
 * so it reads as growing in from off-screen), a twig and a few autumn-gold
 * leaves in the app's amber. Built in the same 3D scene so the lighting
 * matches and his toes grip it. No floor: the branch is what he stands on.
 *
 * Branch top sits at y ~0.01, where his toes are (they rest at y 0.025-0.03).
 */
export const owlPerch: CharacterSpec = {
  ...owl,
  id: 'owl-perch',
  name: 'Hoot (perched)',
  tagline: 'Hoot the scholar owl, perched on a branch',
  frame: { target: 0.5, radius: 0.78 },
  // The checker flags the branch as "cut off at the sides" and "below the floor":
  // both are deliberate (the page edge crops it; this variant is drawn with floor 0).
  bound: { y: 0.5, radius: 1.46 },
  materials: {
    ...owl.materials,
    bark: { color: '#5b3b24', f0: 0.03, spec: 0.3, shininess: 18, rim: 0.5, sheen: 0.2 },
    leaf: { color: '#d9962b', f0: 0.04, spec: 0.7, shininess: 50, rim: 0.6, sss: 0.3, sssColor: '#f6d58a' },
  },
  parts: [
    ...owl.parts,
    /* the branch: thick at the right (off-screen) end, thinning to the left tip;
       its top stays at y ~0.01 where his toes rest */
    { bone: 'root', shape: 'roundCone', from: [1.2, -0.075, -0.04], to: [-0.5, -0.025, 0.02], r1: 0.085, r2: 0.034, material: 'bark' },
    /* a knot and a twig rising behind him */
    { bone: 'root', shape: 'sphere', at: [0.3, -0.035, 0.03], radius: 0.05, blend: 0.04, material: 'bark' },
    { bone: 'root', shape: 'roundCone', from: [0.45, -0.01, -0.03], to: [0.6, 0.22, -0.09], r1: 0.032, r2: 0.012, blend: 0.03, material: 'bark' },
    /* autumn-gold leaves: long and pointed, thin edge-on to the camera */
    { bone: 'root', shape: 'ellipsoid', at: [0.66, 0.27, -0.07], rot: [0.2, 0.3, -0.9], radii: [0.12, 0.04, 0.01], material: 'leaf' },
    { bone: 'root', shape: 'ellipsoid', at: [-0.58, 0.0, 0.04], rot: [0.15, -0.2, 0.45], radii: [0.13, 0.042, 0.01], material: 'leaf' },
    { bone: 'root', shape: 'ellipsoid', at: [-0.479, -0.073, 0.046], rot: [-0.2, 0.25, -0.55], radii: [0.11, 0.038, 0.01], material: 'leaf' },
  ],
};

export default owlPerch;
