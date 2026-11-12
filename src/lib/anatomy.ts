// Mapas de cortes: silhuetas e regiões de boi, porco e frango.
// Coordenadas em viewBox 520x300, animal virado para a esquerda.

export type Animal = "bovino" | "suino" | "frango";

type Region = { id: string; d: string; clip?: boolean };
type AnimalArt = {
  silhouette: string; // corpo, usado como clipPath das regiões
  extras: { d: string; region?: string; kind?: "fill" | "line"; back?: boolean }[]; // chifre, rabo, pernas...
  regions: Region[];
  labels: Record<string, string>;
};

const poly = (pts: number[][]) => "M" + pts.map((p) => p.join(" ")).join(" L") + " Z";

const BOVINO: AnimalArt = {
  silhouette:
    "M28 140 C28 124 46 104 62 94 C76 86 94 88 104 100 C118 92 132 76 156 70 C172 66 186 72 200 76 " +
    "C260 80 330 78 400 76 C425 75 445 78 455 88 C462 110 456 150 444 188 " +
    "C434 206 432 226 434 246 L436 278 L414 280 L414 262 C412 245 406 226 398 212 " +
    "C390 206 370 206 350 210 C310 218 250 218 205 210 " +
    "C192 214 190 240 192 278 L168 280 L168 262 C166 245 160 228 152 214 " +
    "C140 210 124 200 118 188 C112 178 104 168 96 160 C86 156 74 158 64 160 " +
    "C46 164 32 160 28 152 C26 148 26 144 28 140 Z",
  extras: [
    // chifre
    { d: "M84 90 C80 78 74 70 64 66 C70 63 80 66 86 72 C90 78 93 85 95 93 Z" },
    // orelha
    { d: "M96 98 C104 88 116 82 130 82 C124 92 112 100 100 104 Z" },
    // rabo
    { back: true, d: "M452 92 C462 104 466 132 464 170 L466 206 C474 214 472 228 462 228 C454 226 454 214 458 206 L456 170 C458 136 454 112 446 100 Z" },
  ],
  regions: [
    { id: "cabeca", d: poly([[0, 0], [104, 0], [100, 100], [92, 175], [0, 175]]) },
    { id: "pescoco", d: poly([[104, 0], [132, 0], [138, 104], [116, 150], [92, 175], [100, 100]]) },
    { id: "cupim", d: poly([[132, 0], [205, 0], [198, 90], [168, 92], [138, 104]]) },
    { id: "acem", d: poly([[138, 104], [168, 92], [198, 90], [222, 86], [224, 138], [178, 140], [150, 132]]) },
    { id: "paleta", d: poly([[116, 150], [138, 104], [150, 132], [178, 140], [224, 138], [222, 180], [200, 214], [150, 214], [130, 190]]) },
    { id: "peito", d: poly([[92, 175], [116, 150], [130, 190], [150, 214], [120, 230], [80, 230]]) },
    { id: "musculo", d: poly([[120, 230], [150, 214], [200, 214], [200, 300], [120, 300]]) },
    { id: "ancho", d: poly([[198, 90], [205, 0], [280, 0], [280, 128], [224, 138], [222, 86]]) },
    { id: "contrafile", d: poly([[280, 0], [355, 0], [352, 118], [280, 118]]) },
    { id: "file-mignon", d: poly([[280, 118], [352, 118], [355, 140], [280, 140]]) },
    { id: "costela", d: poly([[224, 138], [280, 140], [355, 140], [350, 170], [300, 180], [222, 180]]) },
    { id: "ponta-agulha", d: poly([[222, 180], [300, 180], [300, 300], [200, 300], [200, 214]]) },
    { id: "fraldinha", d: poly([[300, 180], [350, 170], [375, 175], [398, 212], [380, 300], [300, 300]]) },
    { id: "alcatra", d: poly([[355, 0], [400, 0], [408, 108], [402, 150], [355, 140], [352, 118]]) },
    { id: "picanha", d: poly([[400, 0], [520, 0], [520, 92], [460, 100], [408, 108]]) },
    { id: "coxao-mole", d: poly([[408, 108], [460, 100], [520, 92], [520, 148], [436, 158], [404, 154]]) },
    { id: "patinho", d: poly([[355, 140], [402, 150], [404, 154], [436, 158], [420, 205], [398, 212], [375, 175], [350, 170]]) },
    { id: "coxao-duro", d: poly([[436, 158], [520, 148], [520, 222], [428, 222], [420, 205]]) },
    { id: "musculo", d: poly([[398, 212], [420, 205], [428, 222], [520, 222], [520, 300], [380, 300]]) },
  ],
  labels: {
    cupim: "Cupim",
    acem: "Acém",
    paleta: "Paleta",
    peito: "Peito",
    musculo: "Músculo",
    ancho: "Ancho · contrafilé dianteiro",
    contrafile: "Contrafilé",
    "file-mignon": "Filé mignon",
    costela: "Costela",
    "ponta-agulha": "Ponta de agulha",
    fraldinha: "Fraldinha",
    alcatra: "Alcatra",
    picanha: "Picanha",
    patinho: "Patinho",
    "coxao-mole": "Coxão mole",
    "coxao-duro": "Coxão duro",
    pescoco: "Pescoço",
    cabeca: "Cabeça",
  },
};

const SUINO: AnimalArt = {
  silhouette:
    "M34 132 C30 140 30 156 36 164 L52 168 C70 178 92 186 112 190 C120 200 126 214 132 226 " +
    "L134 274 L156 276 L158 238 C170 238 190 242 210 242 C280 250 340 248 380 240 " +
    "C386 252 388 264 388 276 L412 276 L414 250 C430 240 448 214 456 180 " +
    "C464 140 456 104 432 90 C380 72 280 72 200 76 C170 76 140 80 118 88 " +
    "C100 96 84 104 70 112 C60 118 46 126 34 132 Z",
  extras: [
    // orelha
    { d: "M92 100 C98 88 108 78 120 72 C122 84 120 98 114 108 Z" },
    // focinho (disco)
    { d: "M36 136 C33 142 33 154 37 160", kind: "line" },
    // rabo enrolado
    { d: "M452 104 C470 96 484 104 480 116 C476 126 462 122 466 112 C470 104 482 108 486 98", kind: "line", region: "rabo" },
  ],
  regions: [
    { id: "cabeca", d: poly([[0, 0], [108, 0], [118, 200], [0, 200]]) },
    { id: "copa", d: poly([[108, 0], [195, 0], [192, 118], [115, 128]]) },
    { id: "paleta", d: poly([[115, 128], [192, 118], [200, 190], [205, 262], [100, 262], [118, 200]]) },
    { id: "carre", d: poly([[195, 0], [290, 0], [290, 125], [192, 118]]) },
    { id: "lombo", d: poly([[290, 0], [372, 0], [372, 100], [370, 118], [290, 118]]) },
    { id: "mignon", d: poly([[290, 118], [370, 118], [368, 138], [290, 138]]) },
    { id: "costela", d: poly([[192, 118], [290, 125], [290, 138], [368, 138], [364, 180], [200, 190]]) },
    { id: "barriga", d: poly([[200, 190], [364, 180], [372, 262], [205, 262]]) },
    { id: "picanha", d: poly([[372, 0], [520, 0], [520, 96], [440, 92], [372, 100]]) },
    { id: "pernil", d: poly([[372, 100], [440, 92], [520, 96], [520, 262], [372, 262], [364, 180], [368, 138], [370, 118]]) },
    { id: "pe", d: poly([[100, 262], [220, 262], [220, 300], [100, 300]]) },
    { id: "pe", d: poly([[360, 262], [480, 262], [480, 300], [360, 300]]) },
  ],
  labels: {
    cabeca: "Cabeça · máscara",
    copa: "Copa · sobrepaleta",
    paleta: "Paleta",
    carre: "Carré · bisteca",
    lombo: "Lombo",
    mignon: "Mignon suíno",
    costela: "Costela",
    barriga: "Barriga · panceta",
    picanha: "Picanha suína",
    pernil: "Pernil",
    pe: "Pé",
    rabo: "Rabo",
  },
};

const FRANGO: AnimalArt = {
  silhouette:
    "M150 112 C130 140 128 180 150 208 C180 240 240 250 300 246 C360 242 410 214 432 176 " +
    "C448 150 456 120 470 86 L482 58 C470 62 452 72 440 82 C420 96 400 100 380 100 " +
    "C320 98 250 96 200 100 C180 96 170 86 166 70 C162 50 148 36 128 36 " +
    "C110 36 98 48 96 60 L74 68 L96 76 C100 90 120 100 150 112 Z",
  extras: [
    // crista
    { d: "M104 42 C102 30 110 24 116 32 C118 20 128 18 130 30 C134 20 146 22 142 36 C130 34 116 36 104 42 Z", kind: "fill" },
    // barbela
    { d: "M98 76 C96 88 102 96 108 92 C110 86 106 80 104 78 Z", kind: "fill" },
    // pernas
    { d: "M282 250 L276 288 M276 288 L262 294 M276 288 L284 296 M276 288 L290 290", kind: "line" },
    { d: "M318 248 L326 286 M326 286 L312 292 M326 286 L334 296 M326 286 L342 290", kind: "line" },
  ],
  regions: [
    { id: "peito", d: poly([[120, 96], [205, 100], [232, 170], [215, 260], [100, 260]]), clip: true },
    { id: "dorso", d: poly([[205, 100], [520, 60], [520, 260], [215, 260], [232, 170]]), clip: true },
    // sobrecoxa e coxa ficam sobre o corpo, sem recorte
    { id: "sobrecoxa", d: "M276 196 C290 172 336 166 360 184 C376 198 366 226 342 236 C318 244 290 238 280 224 C274 216 272 206 276 196 Z" },
    { id: "coxa", d: "M290 232 C302 226 326 228 334 238 C336 246 326 252 316 254 L304 264 C298 268 290 264 292 256 C288 248 286 238 290 232 Z" },
    { id: "asa", d: "M214 128 C250 112 320 112 372 136 C384 142 382 150 372 152 C340 166 300 176 262 172 C238 168 218 156 210 142 C208 136 210 130 214 128 Z" },
    { id: "miudos", d: "M188 170 C188 160 200 158 204 166 C208 158 220 160 220 170 C220 182 204 190 204 194 C204 190 188 182 188 170 Z" },
  ],
  labels: {
    peito: "Peito",
    asa: "Asa · coxinha da asa e tulipa",
    coxa: "Coxa",
    sobrecoxa: "Sobrecoxa",
    miudos: "Miúdos · coração e moela",
    dorso: "Dorso",
  },
};

export const ANATOMY: Record<Animal, AnimalArt> = { bovino: BOVINO, suino: SUINO, frango: FRANGO };

export const ANIMAL_LABEL: Record<Animal, string> = { bovino: "Boi", suino: "Porco", frango: "Frango" };

export function regionLabel(animal: Animal, id: string) {
  return ANATOMY[animal].labels[id] ?? id;
}

export function regionOptions(animal: Animal) {
  return Object.entries(ANATOMY[animal].labels)
    .filter(([id]) => !["cabeca", "pescoco", "dorso"].includes(id) || animal === "suino")
    .map(([id, label]) => ({ id, label }));
}
