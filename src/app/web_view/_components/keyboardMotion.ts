// One shared object so every keyboard consumer resolves to the same glide
// clock — a composer gliding while the scroll fold snaps would diverge.
export const KEYBOARD_GLIDE = { glide: true } as const;
