export const COUNTRIES = [
  { code: 'global',   label: 'Global',    flag: '🌍', namespace: 'global'   },
  { code: 'algeria',  label: 'Algeria',   flag: '🇩🇿', namespace: 'algeria'  },
  { code: 'oman',     label: 'Oman',      flag: '🇴🇲', namespace: 'oman'     },
  { code: 'ksa',      label: 'KSA',       flag: '🇸🇦', namespace: 'ksa'      },
  { code: 'egypt',    label: 'Egypt',     flag: '🇪🇬', namespace: 'egypt'    },
  { code: 'iraq',     label: 'Iraq',      flag: '🇮🇶', namespace: 'iraq'     },
  { code: 'kuwait',   label: 'Kuwait',    flag: '🇰🇼', namespace: 'kuwait'   },
  { code: 'uae',      label: 'UAE',       flag: '🇦🇪', namespace: 'uae'      },
  { code: 'abudhabi', label: 'Abu Dhabi', flag: '🇦🇪', namespace: 'abudhabi' },
  { code: 'qatar',    label: 'Qatar',     flag: '🇶🇦', namespace: 'qatar'    },
  { code: 'bahrain',  label: 'Bahrain',   flag: '🇧🇭', namespace: 'bahrain'  },
  { code: 'libya',    label: 'Libya',     flag: '🇱🇾', namespace: 'libya'    },
  { code: 'nigeria',  label: 'Nigeria',   flag: '🇳🇬', namespace: 'nigeria'  },
] as const;

export type CountryCode = (typeof COUNTRIES)[number]['code'];
