export interface Tokhirgoo {
  aldangiinKhuvi: number;
  aldangiChuluulukhKhonog: number;
  aldangiBodojEkhlekhOgnoo: Date;
  eBarimtAshiglakhEsekh: boolean;
  eBarimtShine: boolean;
  eBarimtAutomataarIlgeekh: boolean;
  eBarimtBugdShivikh: boolean;
  eBarimtMessageIlgeekhEsekh: boolean;
  merchantTin: string;
  duuregNer: string;
  districtCode: string;
  horoo: {
    ner: string;
    kod: string;
  };
  sohNer: string;
  orts: string;
  davkhar: string[];
  nuatTulukhEsekh: boolean;
  zogsoolMsgIlgeekh: boolean;
  tooluurAutomatTatakhToken: string;
  sarBurAutoKhungulultOruulakhEsekh: boolean;
  khungulukhSarBuriinShalguurDun: number;
  khungulukhSarBuriinTurul: string;
  khungulukhSarBuriinUtga: number;
  khungulukhSarBuriinTulburEkhlekhUdur: number;
  khungulukhSarBuriinTulburDuusakhUdur: number;
  tureesiinDungeesKhungulukhEsekh: boolean;
  ashiglaltDungeesKhungulukhEsekh: boolean;
  jilBurTalbaiTulburNemekhEsekh: boolean;
  jilBurTulbur: number;
  gereeDuusakhTalbaiTulburNemekhEsekh: boolean;
  gereeDuusakhTulbur: number;
  zochinUrikhUneguiMinut: number;
}

export interface Davkhar {
  davkhar: string;
  talbai: number;
  tariff: number;
  planZurag: string;
}

export interface Barilga {
  _id: string;
  bairshil?: {
    type: string;
    coordinates: number[];
  };
  ner: string;
  khayag: string;
  register: string;
  niitTalbai: number;
  tokhirgoo: Tokhirgoo;
  davkharuud: Davkhar[];
}

export interface Erkh {
  zam: string;
  ner: string;
  tailbar: string;
  tokhirgoo: {
    utga: string;
    ner: string;
    tailbar: string;
  }[];
}

export interface BaiguullagaTokhirgoo {
  aldangiinKhuvi: number;
  aldangiChuluulukhKhonog: number;
  aldangiBodojEkhlekhOgnoo: Date;
  gereeDuusgakhSar: number;
  baritsaaAvakhSar: number;
  bukhAjiltanKhungulultOruulakhEsekh: boolean;
  khonogKhungulultOruulakhEsekh: boolean;
  deedKhungulultiinKhuvi: number;
  gereeAvtomataarSungakhEsekh: boolean;
  bukhAjiltanGereendZasvarOruulakhEsekh: boolean;
  eBarimtAshiglakhEsekh: boolean;
  eBarimtAutomataarShivikh: boolean;
  eBarimtAutomataarIlgeekh: boolean;
  msgIlgeekhKey: string;
  msgIlgeekhDugaar: string;
  msgAvakhTurul: string;
  msgAvakhDugaar: string[];
  msgAvakhTsag: string;
  zogsoolMsgZagvar: string;
  mailNevtrekhNer: string;
  mailPassword: string;
  mailHost: string;
  mailPort: string;
  khereglegchEkhlekhOgnoo: Date;
  zogsooliinMinut: number;
  zogsooliinKhungulukhMinut: number;
  zogsooliinDun: number;
  apiAvlagaDans: string;
  apiOrlogoDans: string;
  apiNuatDans: string;
  apiZogsoolDans: string;
  apiTogloomiinTuvDans: string;
  aktAshiglakhEsekh: boolean;
  guidelBuchiltKhonogEsekh: boolean;
  sekhDemjikhTulburAvakhEsekh: boolean;
  bichiltKhonog: number;
  udruurBodokhEsekh: boolean;
  baritsaaUneAdiltgakhEsekh: boolean;
  zogsoolNer: string;
  qpayShimtgelTusdaa: boolean;
  davkharsanMDTSDavtamjSecond: number;
  zurchulMsgeerSanuulakh: boolean;
  guidliinKoepEsekh: boolean;
  msgNegjUne: number;
  gadaaStickerAshiglakhEsekh: boolean;
  togloomiinTuvDavkhardsanShalgakh: boolean;
  dotorGadnaTsagEsekh: boolean;
  merchantTin?: string;

  districtCode?: string;
  duuregNer?: string;
  horoo?: {
    ner: string;
    kod: string;
  };
}

export interface Baiguullaga {
  _id: string;
  id: string;
  ner: string;
  dotoodNer: string;
  khayag: string;
  email: string;
  register: string;
  utas: string;
  bankNer: string;
  dans: string;
  barilguud: Barilga[];
  davkhar: number;
  talbai: number;
  tokhirgoo: BaiguullagaTokhirgoo;
  erkhuud: Erkh[];
  duureg?: any;
  horoo?: any;
  merchantTin?: string;
  eBarimtAutomataarIlgeekh?: boolean;
  nuatTulukhEsekh?: boolean;
  eBarimtAshiglakhEsekh?: boolean;
  eBarimtShine?: boolean;
  createdAt: Date;
  updatedAt: Date;
}
