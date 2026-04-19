export interface Country {
  code: string
  flag: string
  name: string
  dial: string
}

export const COUNTRIES: Country[] = [
  { code:'MG', flag:'🇲🇬', name:'Madagascar',    dial:'+261' },
  { code:'FR', flag:'🇫🇷', name:'France',         dial:'+33'  },
  { code:'BE', flag:'🇧🇪', name:'Belgique',       dial:'+32'  },
  { code:'CH', flag:'🇨🇭', name:'Suisse',         dial:'+41'  },
  { code:'CA', flag:'🇨🇦', name:'Canada',         dial:'+1'   },
  { code:'US', flag:'🇺🇸', name:'États-Unis',     dial:'+1'   },
  { code:'GB', flag:'🇬🇧', name:'Royaume-Uni',    dial:'+44'  },
  { code:'DE', flag:'🇩🇪', name:'Allemagne',      dial:'+49'  },
  { code:'ES', flag:'🇪🇸', name:'Espagne',        dial:'+34'  },
  { code:'IT', flag:'🇮🇹', name:'Italie',         dial:'+39'  },
  { code:'PT', flag:'🇵🇹', name:'Portugal',       dial:'+351' },
  { code:'NL', flag:'🇳🇱', name:'Pays-Bas',       dial:'+31'  },
  { code:'MA', flag:'🇲🇦', name:'Maroc',          dial:'+212' },
  { code:'SN', flag:'🇸🇳', name:'Sénégal',        dial:'+221' },
  { code:'CI', flag:'🇨🇮', name:"Côte d'Ivoire",  dial:'+225' },
  { code:'DZ', flag:'🇩🇿', name:'Algérie',        dial:'+213' },
  { code:'TN', flag:'🇹🇳', name:'Tunisie',        dial:'+216' },
  { code:'AE', flag:'🇦🇪', name:'Émirats arabes', dial:'+971' },
  { code:'SG', flag:'🇸🇬', name:'Singapour',      dial:'+65'  },
  { code:'IN', flag:'🇮🇳', name:'Inde',           dial:'+91'  },
  { code:'JP', flag:'🇯🇵', name:'Japon',          dial:'+81'  },
  { code:'AU', flag:'🇦🇺', name:'Australie',      dial:'+61'  },
  { code:'BR', flag:'🇧🇷', name:'Brésil',         dial:'+55'  },
  { code:'ZA', flag:'🇿🇦', name:'Afrique du Sud', dial:'+27'  },
  { code:'NG', flag:'🇳🇬', name:'Nigeria',        dial:'+234' },
]
