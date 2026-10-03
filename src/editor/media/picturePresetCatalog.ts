import type { ElementPreset } from "../../domain/element/types";

export interface PicturePresetItem {
  id: string;
  name: string;
  src: string;
  width: number;
  height: number;
  checksum: string;
  tags: string;
}

export const STARTER_PICTURES = [
  {
    "id": "boy-thinking",
    "name": "Boy Thinking",
    "src": "/assets/picture-presets/boy-thinking.png",
    "width": 1254,
    "height": 1254,
    "checksum": "a7eefe517996c36b395c2b0edea307bbdffa0e3b6e94fdbc622a4a27a627a05b",
    "tags": "ideas thinking learner"
  },
  {
    "id": "girl-writing",
    "name": "Girl Writing",
    "src": "/assets/picture-presets/girl-writing.png",
    "width": 1254,
    "height": 1254,
    "checksum": "dd62d67df5d7877ba79965e32dd1f1305893424420aafbe5bd45d72c13c621e8",
    "tags": "writing notebook learner"
  },
  {
    "id": "boy-reading",
    "name": "Boy Reading",
    "src": "/assets/picture-presets/boy-reading.png",
    "width": 1254,
    "height": 1254,
    "checksum": "27f9f5235a86bd87a1e6f90479533e2e195503a8ad10ffa1c0958f885ce0eb67",
    "tags": "reading book learner"
  },
  {
    "id": "girl-thinking",
    "name": "Girl Thinking",
    "src": "/assets/picture-presets/girl-thinking.png",
    "width": 1254,
    "height": 1254,
    "checksum": "f240028a5865ec6ab536b101aa949f93f38f81cdf105711418d6a4842cc6ecec",
    "tags": "ideas thinking learner"
  },
  {
    "id": "boy-writing",
    "name": "Boy Writing",
    "src": "/assets/picture-presets/boy-writing.png",
    "width": 1254,
    "height": 1254,
    "checksum": "db27582e4b0a099d1ddd5dbddaa91b56a904e9f35bcd679757aad1d72f5ab2b4",
    "tags": "writing notebook learner"
  },
  {
    "id": "girl-reading",
    "name": "Girl Reading",
    "src": "/assets/picture-presets/girl-reading.png",
    "width": 1254,
    "height": 1254,
    "checksum": "c1af82f5aa1cd3b03d3ea81d5ef1ca9a279f1547bc581dc92203acc0a52aced9",
    "tags": "reading books learner"
  },
  {
    "id": "learning-together",
    "name": "Learning Together",
    "src": "/assets/picture-presets/learning-together.png",
    "width": 1254,
    "height": 1254,
    "checksum": "7b4764feb2fa1d1ec5dfe66e582ce565f1d743916b55fc2535bc8a46949ae064",
    "tags": "study friends reading writing"
  },
  {
    "id": "boy-raising-hand",
    "name": "Boy Raising Hand",
    "src": "/assets/picture-presets/boy-raising-hand.png",
    "width": 1254,
    "height": 1254,
    "checksum": "3fd7841dce6a3aec049f3721f9e2bcc8ca6de73d02751ea461651d7e491db883",
    "tags": "answer participation learner"
  },
  {
    "id": "girl-maths",
    "name": "Girl Maths",
    "src": "/assets/picture-presets/girl-maths.png",
    "width": 1254,
    "height": 1254,
    "checksum": "a32ab42cc328c850574191391aec12bca5e749a690626a859e5adaac8f50d1a7",
    "tags": "mathematics arithmetic learner"
  },
  {
    "id": "girl-ready-for-school",
    "name": "Girl Ready for School",
    "src": "/assets/picture-presets/girl-ready-for-school.png",
    "width": 1254,
    "height": 1254,
    "checksum": "509d187cda4e4a5e05cc8522720a92682f9745b7d719470c065243b5b0bcdee6",
    "tags": "school book backpack learner"
  }
] as const;

export const CLAY_DOODLE_PICTURES = [
  {
    "id": "clay-3d-cone-pyramid",
    "name": "Clay 3d Cone Pyramid",
    "src": "/assets/picture-presets/clay-3d-cone-pyramid.svg",
    "width": 500,
    "height": 500,
    "checksum": "9b51d9518510cf7c1357b7fbb62ccfb34b498941f2ac9589af68431a99c2c65b",
    "tags": "clay doodle 3d maths education 3d cone pyramid geometry school stem visual"
  },
  {
    "id": "clay-3d-cube",
    "name": "Clay 3d Cube",
    "src": "/assets/picture-presets/clay-3d-cube.svg",
    "width": 500,
    "height": 500,
    "checksum": "20d80272f18ed2ec0554cc79da71168866892b749a428244370e84b5cb6b26b7",
    "tags": "clay doodle 3d maths education 3d cube geometry school stem visual"
  },
  {
    "id": "clay-3d-sphere-cylinder",
    "name": "Clay 3d Sphere Cylinder",
    "src": "/assets/picture-presets/clay-3d-sphere-cylinder.svg",
    "width": 500,
    "height": 500,
    "checksum": "f6c99c4ebf860ae19557e5398729944d9cb3133a46b15ae0ff08896687528e38",
    "tags": "clay doodle 3d maths education 3d sphere cylinder geometry school stem visual"
  },
  {
    "id": "clay-abacus",
    "name": "Clay Abacus",
    "src": "/assets/picture-presets/clay-abacus.svg",
    "width": 500,
    "height": 500,
    "checksum": "8e0f3945c7f555b885e39a8afb37e20ee4b8ea01d36a02f9e5e75f2e6f61f28e",
    "tags": "clay doodle 3d maths education abacus geometry school stem visual"
  },
  {
    "id": "clay-alarm-clock",
    "name": "Clay Alarm Clock",
    "src": "/assets/picture-presets/clay-alarm-clock.svg",
    "width": 500,
    "height": 500,
    "checksum": "120654e6bebc34b1fbccd56b24539066c6d9dd1b7ffc803d07cba728cfe95c89",
    "tags": "clay doodle 3d maths education alarm clock geometry school stem visual"
  },
  {
    "id": "clay-balance-scale",
    "name": "Clay Balance Scale",
    "src": "/assets/picture-presets/clay-balance-scale.svg",
    "width": 500,
    "height": 500,
    "checksum": "2fc4f5d9ddf805bb8e251fb22b0b7f7bec41447cd3980012ec1670c77264fe05",
    "tags": "clay doodle 3d maths education balance scale geometry school stem visual"
  },
  {
    "id": "clay-bar-chart",
    "name": "Clay Bar Chart",
    "src": "/assets/picture-presets/clay-bar-chart.svg",
    "width": 500,
    "height": 500,
    "checksum": "d7b7bb8f9ce382f14c3c95fe119104999ad7c97f06024996dc26441ca447c748",
    "tags": "clay doodle 3d maths education bar chart geometry school stem visual"
  },
  {
    "id": "clay-blackboard-math",
    "name": "Clay Blackboard Math",
    "src": "/assets/picture-presets/clay-blackboard-math.svg",
    "width": 500,
    "height": 500,
    "checksum": "33df789f1c32545137282829c9aeb061346d741c95fae35ffbc79a6d7b12bb0d",
    "tags": "clay doodle 3d maths education blackboard math geometry school stem visual"
  },
  {
    "id": "clay-book-stack",
    "name": "Clay Book Stack",
    "src": "/assets/picture-presets/clay-book-stack.svg",
    "width": 500,
    "height": 500,
    "checksum": "bd75210eb7c2f5454b7e63c08e94289945b873fba7b5fcc9e995a8570d9b83c1",
    "tags": "clay doodle 3d maths education book stack geometry school stem visual"
  },
  {
    "id": "clay-brain-gears",
    "name": "Clay Brain Gears",
    "src": "/assets/picture-presets/clay-brain-gears.svg",
    "width": 500,
    "height": 500,
    "checksum": "d63c62b2afb7053c1f6e615e256612d9d1ccee0528c2d2ec4431fa15db837751",
    "tags": "clay doodle 3d maths education brain gears geometry school stem visual"
  },
  {
    "id": "clay-calculator",
    "name": "Clay Calculator",
    "src": "/assets/picture-presets/clay-calculator.svg",
    "width": 500,
    "height": 500,
    "checksum": "069a18ad6733bdc2bb1be640696638052ad9261e161a3bb55574fe2c747b143d",
    "tags": "clay doodle 3d maths education calculator geometry school stem visual"
  },
  {
    "id": "clay-clipboard-a-plus",
    "name": "Clay Clipboard A Plus",
    "src": "/assets/picture-presets/clay-clipboard-a-plus.svg",
    "width": 500,
    "height": 500,
    "checksum": "fecce5939cc48cf47b8a4f706948d0973c675d46d3204ccc6f9478a93ec66248",
    "tags": "clay doodle 3d maths education clipboard a plus geometry school stem visual"
  },
  {
    "id": "clay-compass-divider",
    "name": "Clay Compass Divider",
    "src": "/assets/picture-presets/clay-compass-divider.svg",
    "width": 500,
    "height": 500,
    "checksum": "4571b7cf07a018d66f1da3bd884344038790a686d653e74c259f2015720b3928",
    "tags": "clay doodle 3d maths education compass divider geometry school stem visual"
  },
  {
    "id": "clay-compass-rose",
    "name": "Clay Compass Rose",
    "src": "/assets/picture-presets/clay-compass-rose.svg",
    "width": 500,
    "height": 500,
    "checksum": "82c3cd01e1515e8bc82a24bbf67f77654c8ae1b4c917cd7ad2619bec12ac414b",
    "tags": "clay doodle 3d maths education compass rose geometry school stem visual"
  },
  {
    "id": "clay-domino-tiles",
    "name": "Clay Domino Tiles",
    "src": "/assets/picture-presets/clay-domino-tiles.svg",
    "width": 500,
    "height": 500,
    "checksum": "dd7315ffbd88765694297b0c067dfecace7ec5336a11b9f2f33ca7b6ab01ae38",
    "tags": "clay doodle 3d maths education domino tiles geometry school stem visual"
  },
  {
    "id": "clay-equals-badge",
    "name": "Clay Equals Badge",
    "src": "/assets/picture-presets/clay-equals-badge.svg",
    "width": 500,
    "height": 500,
    "checksum": "34603eccfcc9ec8af9da2ca61b294c2897ad9b0cf420d87d3c8d89cbfbbca49d",
    "tags": "clay doodle 3d maths education equals badge geometry school stem visual"
  },
  {
    "id": "clay-fraction-bars",
    "name": "Clay Fraction Bars",
    "src": "/assets/picture-presets/clay-fraction-bars.svg",
    "width": 500,
    "height": 500,
    "checksum": "f0321b583c6b27cfd3e7a5160cd46aafce7dae112d741ead3e44942c6960edcc",
    "tags": "clay doodle 3d maths education fraction bars geometry school stem visual"
  },
  {
    "id": "clay-fraction-pie",
    "name": "Clay Fraction Pie",
    "src": "/assets/picture-presets/clay-fraction-pie.svg",
    "width": 500,
    "height": 500,
    "checksum": "b9a50d7c61b98e966a1dfd23a1d6f80a40a758d27f992c818f4f9780a174ee15",
    "tags": "clay doodle 3d maths education fraction pie geometry school stem visual"
  },
  {
    "id": "clay-geometry-ruler",
    "name": "Clay Geometry Ruler",
    "src": "/assets/picture-presets/clay-geometry-ruler.svg",
    "width": 500,
    "height": 500,
    "checksum": "0f57a7d57c8b60f371d4957eadff58db6516126dd96e97bb6104b3353e232518",
    "tags": "clay doodle 3d maths education geometry ruler geometry school stem visual"
  },
  {
    "id": "clay-globe",
    "name": "Clay Globe",
    "src": "/assets/picture-presets/clay-globe.svg",
    "width": 500,
    "height": 500,
    "checksum": "31f77dbd34a39414c3298a8bec2612d82b86a41e1d3c59a6ddbec105ee90868a",
    "tags": "clay doodle 3d maths education globe geometry school stem visual"
  },
  {
    "id": "clay-gold-trophy",
    "name": "Clay Gold Trophy",
    "src": "/assets/picture-presets/clay-gold-trophy.svg",
    "width": 500,
    "height": 500,
    "checksum": "84e980445f6ae9f75ce82d380d6f09e033e0b4a3a7326a29659fbe31c8d3b79c",
    "tags": "clay doodle 3d maths education gold trophy geometry school stem visual"
  },
  {
    "id": "clay-graduation-cap",
    "name": "Clay Graduation Cap",
    "src": "/assets/picture-presets/clay-graduation-cap.svg",
    "width": 500,
    "height": 500,
    "checksum": "737588ec85d618a37416fc401413e6c8bb1655d20faff00b9a29931378fbe8ff",
    "tags": "clay doodle 3d maths education graduation cap geometry school stem visual"
  },
  {
    "id": "clay-hourglass-timer",
    "name": "Clay Hourglass Timer",
    "src": "/assets/picture-presets/clay-hourglass-timer.svg",
    "width": 500,
    "height": 500,
    "checksum": "15bfcb0468466e9e784146e0362d7e948fad9702a5d540e2bd3003a3a16cba2f",
    "tags": "clay doodle 3d maths education hourglass timer geometry school stem visual"
  },
  {
    "id": "clay-lightbulb-idea",
    "name": "Clay Lightbulb Idea",
    "src": "/assets/picture-presets/clay-lightbulb-idea.svg",
    "width": 500,
    "height": 500,
    "checksum": "a6ee6a20583f145e412845ca7216e8640ba6d046cb85933b185defc91519fd9d",
    "tags": "clay doodle 3d maths education lightbulb idea geometry school stem visual"
  },
  {
    "id": "clay-magnifying-glass",
    "name": "Clay Magnifying Glass",
    "src": "/assets/picture-presets/clay-magnifying-glass.svg",
    "width": 500,
    "height": 500,
    "checksum": "3b2b1d311c8dc9e06678f1de31fe3e52bc1e9adfcb62605cd445d2c55e46ac08",
    "tags": "clay doodle 3d maths education magnifying glass geometry school stem visual"
  },
  {
    "id": "clay-math-dice",
    "name": "Clay Math Dice",
    "src": "/assets/picture-presets/clay-math-dice.svg",
    "width": 500,
    "height": 500,
    "checksum": "2eba8afb3057fa7e563be72a4c606730d46f41e87696b56319a1ba04bd426e0a",
    "tags": "clay doodle 3d maths education math dice geometry school stem visual"
  },
  {
    "id": "clay-math-matrix",
    "name": "Clay Math Matrix",
    "src": "/assets/picture-presets/clay-math-matrix.svg",
    "width": 500,
    "height": 500,
    "checksum": "c8848306d953a9923223c97e95ab20de251ea4855365e7710ee58cbded9fa339",
    "tags": "clay doodle 3d maths education math matrix geometry school stem visual"
  },
  {
    "id": "clay-medal-first",
    "name": "Clay Medal First",
    "src": "/assets/picture-presets/clay-medal-first.svg",
    "width": 500,
    "height": 500,
    "checksum": "b49ff51c11b8ba9bbba8af13a030344191ec2e81fdb060c3ba8558249afb49ef",
    "tags": "clay doodle 3d maths education medal first geometry school stem visual"
  },
  {
    "id": "clay-money-coins",
    "name": "Clay Money Coins",
    "src": "/assets/picture-presets/clay-money-coins.svg",
    "width": 500,
    "height": 500,
    "checksum": "b24d2bfb1a4f863ba36ddcccd7b54a06b0824067930d287ca5f780a8c4b4a36c",
    "tags": "clay doodle 3d maths education money coins geometry school stem visual"
  },
  {
    "id": "clay-multiply-divide",
    "name": "Clay Multiply Divide",
    "src": "/assets/picture-presets/clay-multiply-divide.svg",
    "width": 500,
    "height": 500,
    "checksum": "00df1ed7170d151019591671067a8657a51503eb948015bf6d9c893df5dae1f4",
    "tags": "clay doodle 3d maths education multiply divide geometry school stem visual"
  },
  {
    "id": "clay-number-line",
    "name": "Clay Number Line",
    "src": "/assets/picture-presets/clay-number-line.svg",
    "width": 500,
    "height": 500,
    "checksum": "9046c920b08df245d06be574475d86d15b4678d6950bb11aa1f766ea1e822fd5",
    "tags": "clay doodle 3d maths education number line geometry school stem visual"
  },
  {
    "id": "clay-open-book",
    "name": "Clay Open Book",
    "src": "/assets/picture-presets/clay-open-book.svg",
    "width": 500,
    "height": 500,
    "checksum": "26edd4277e2c78104a253aab7f507c492db02d46cea1d351731747ad05d11bbc",
    "tags": "clay doodle 3d maths education open book geometry school stem visual"
  },
  {
    "id": "clay-pencil-sharpener",
    "name": "Clay Pencil Sharpener",
    "src": "/assets/picture-presets/clay-pencil-sharpener.svg",
    "width": 500,
    "height": 500,
    "checksum": "dceebdda40675a519dd3649d81befaf5a6ac817f29617f8ccd0874ebad45e69b",
    "tags": "clay doodle 3d maths education pencil sharpener geometry school stem visual"
  },
  {
    "id": "clay-pie-chart-3d",
    "name": "Clay Pie Chart 3d",
    "src": "/assets/picture-presets/clay-pie-chart-3d.svg",
    "width": 500,
    "height": 500,
    "checksum": "b3c2acbc4f79d2778e4b3c79b8291c50c0f42938d92c8549fbd52adebcb5da44",
    "tags": "clay doodle 3d maths education pie chart 3d geometry school stem visual"
  },
  {
    "id": "clay-plus-minus",
    "name": "Clay Plus Minus",
    "src": "/assets/picture-presets/clay-plus-minus.svg",
    "width": 500,
    "height": 500,
    "checksum": "62ae17b1b49259c43d123a02069c3ef897037ef300d8b70066f954418c945147",
    "tags": "clay doodle 3d maths education plus minus geometry school stem visual"
  },
  {
    "id": "clay-protractor",
    "name": "Clay Protractor",
    "src": "/assets/picture-presets/clay-protractor.svg",
    "width": 500,
    "height": 500,
    "checksum": "160859b8a8de02ee25bf612a9cb2742be98a9dc1aab52c30767b5e9d32d12e68",
    "tags": "clay doodle 3d maths education protractor geometry school stem visual"
  },
  {
    "id": "clay-school-backpack",
    "name": "Clay School Backpack",
    "src": "/assets/picture-presets/clay-school-backpack.svg",
    "width": 500,
    "height": 500,
    "checksum": "bb0f2e4e5b60a7b887bca85d380cfd547095e3b3e3c2c6f0d9235ff234d9e2e4",
    "tags": "clay doodle 3d maths education school backpack geometry school stem visual"
  },
  {
    "id": "clay-science-beaker",
    "name": "Clay Science Beaker",
    "src": "/assets/picture-presets/clay-science-beaker.svg",
    "width": 500,
    "height": 500,
    "checksum": "b424f7f6f6dc44615d36b38fb17c87816a21efa6988794064c731a0938e97f87",
    "tags": "clay doodle 3d maths education science beaker geometry school stem visual"
  },
  {
    "id": "clay-set-square",
    "name": "Clay Set Square",
    "src": "/assets/picture-presets/clay-set-square.svg",
    "width": 500,
    "height": 500,
    "checksum": "ffa19719fe3da87e35feaa1982e67cfb051e81242338bbcf4094f53101692163",
    "tags": "clay doodle 3d maths education set square geometry school stem visual"
  },
  {
    "id": "clay-tangram-cat",
    "name": "Clay Tangram Cat",
    "src": "/assets/picture-presets/clay-tangram-cat.svg",
    "width": 500,
    "height": 500,
    "checksum": "45bf6f4b7ac900807a51bf9a8f87e113bbc389387d0eb4862ffc2368a218a22d",
    "tags": "clay doodle 3d maths education tangram cat geometry school stem visual"
  },
  {
    "id": "clay-thermometer",
    "name": "Clay Thermometer",
    "src": "/assets/picture-presets/clay-thermometer.svg",
    "width": 500,
    "height": 500,
    "checksum": "eaf486f2b07f609baca69206daa3599b27b65a161b9e166fd078099590d30a4f",
    "tags": "clay doodle 3d maths education thermometer geometry school stem visual"
  },
  {
    "id": "clay-venn-diagram",
    "name": "Clay Venn Diagram",
    "src": "/assets/picture-presets/clay-venn-diagram.svg",
    "width": 500,
    "height": 500,
    "checksum": "09076eb3b83a6a2d3035fc22ea1f23f6dbc56a14d1882e3f2eea8918fe4fc695",
    "tags": "clay doodle 3d maths education venn diagram geometry school stem visual"
  }
] as const;

export const ALL_PICTURE_PRESETS: readonly PicturePresetItem[] = [
  ...STARTER_PICTURES,
  ...CLAY_DOODLE_PICTURES
];

export const picturePresets: Record<string, ElementPreset> = Object.fromEntries(
  ALL_PICTURE_PRESETS.map((picture) => {
    const width = 180;
    const height = Math.round((width * picture.height) / picture.width);
    const id = `preset-picture-${picture.id}`;
    return [
      id,
      {
        id,
        type: "image",
        category: "media",
        name: picture.name,
        variant: "picture",
        description: picture.tags,
        icon: "Image",
        defaultTransform: { width, height, rotation: 0 },
        defaultStyle: { objectFit: "contain", backgroundColor: "transparent", opacity: 1 },
        defaultContent: {
          src: picture.src,
          alt: picture.name,
          rawWidthPx: picture.width,
          rawHeightPx: picture.height,
          starterPictureId: picture.id,
        },
      },
    ];
  })
);
