export interface CardGradient {
  c1: string
  c2: string
  ac: string
}

export interface GradientState {
  css: string
  sh:  string
  ac:  string
  c1:  string
  c2:  string
}

export interface Card {
  id?:          string
  handle:       string
  name:         string
  role?:        string
  company?:     string
  email?:       string
  phone?:       string
  linkedin?:    string
  socials?:     Record<string, string>
  gradient:     CardGradient
  logo_url?:    string
  country_code?: string
  view_count?:  number
  created_at?:  string
}
