export interface PersonalityDNA {
  id:              string;
  label:           string;
  easing:          string;
  duration:        number;
  fontWeight:      number;
  letterSpacing:   string;
  borderRadius:    string;
  shadowIntensity: number;
  motionDistance:  number;
  accentOpacity:   number;
  description:     string;
}

export const personalities: PersonalityDNA[] = [
  {
    id:              "cinematic",
    label:           "Cinematic",
    easing:          "cubic-bezier(0.76, 0, 0.24, 1)",
    duration:        700,
    fontWeight:      300,
    letterSpacing:   "0.06em",
    borderRadius:    "2px",
    shadowIntensity: 1.4,
    motionDistance:  24,
    accentOpacity:   0.6,
    description:     "slow, deliberate, film-like weight",
  },
  {
    id:              "surgical",
    label:           "Surgical",
    easing:          "cubic-bezier(0.4, 0, 0, 1)",
    duration:        160,
    fontWeight:      400,
    letterSpacing:   "0.01em",
    borderRadius:    "1px",
    shadowIntensity: 0.6,
    motionDistance:  6,
    accentOpacity:   1,
    description:     "precise, instant, no excess",
  },
  {
    id:              "minimal",
    label:           "Minimal",
    easing:          "cubic-bezier(0.16, 1, 0.3, 1)",
    duration:        400,
    fontWeight:      300,
    letterSpacing:   "0.04em",
    borderRadius:    "0px",
    shadowIntensity: 0.3,
    motionDistance:  12,
    accentOpacity:   0.4,
    description:     "recedes, breathes, disappears",
  },
  {
    id:              "brutalist",
    label:           "Brutalist",
    easing:          "cubic-bezier(0, 0, 1, 1)",
    duration:        80,
    fontWeight:      800,
    letterSpacing:   "-0.02em",
    borderRadius:    "0px",
    shadowIntensity: 0,
    motionDistance:  0,
    accentOpacity:   1,
    description:     "raw, instant, undecorated",
  },
  {
    id:              "apple",
    label:           "Apple-like",
    easing:          "cubic-bezier(0.34, 1.56, 0.64, 1)",
    duration:        500,
    fontWeight:      400,
    letterSpacing:   "0.0em",
    borderRadius:    "12px",
    shadowIntensity: 1,
    motionDistance:  16,
    accentOpacity:   0.8,
    description:     "settles, breathes, feels inevitable",
  },
  {
    id:              "experimental",
    label:           "Experimental",
    easing:          "cubic-bezier(0.87, 0, 0.13, 1)",
    duration:        900,
    fontWeight:      600,
    letterSpacing:   "0.12em",
    borderRadius:    "50px",
    shadowIntensity: 2,
    motionDistance:  40,
    accentOpacity:   0.5,
    description:     "unstable, searching, alive",
  },
];
