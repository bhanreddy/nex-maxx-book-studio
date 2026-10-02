import type { ElementPreset } from "../../domain/element/types";

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

export const picturePresets: Record<string, ElementPreset> = Object.fromEntries(STARTER_PICTURES.map(picture => {
  const width = 220, height = width * picture.height / picture.width;
  const id = `preset-picture-${picture.id}`;
  return [id, { id, type: "image", category: "media", name: picture.name, variant: "picture", description: picture.tags, icon: "Image",
    defaultTransform: { width, height, rotation: 0 }, defaultStyle: { objectFit: "contain", backgroundColor: "transparent", opacity: 1 },
    defaultContent: { src: picture.src, alt: picture.name, rawWidthPx: picture.width, rawHeightPx: picture.height, starterPictureId: picture.id } }];
}));
