"""One-off: optimise Marhaba Manzil images from the project repo into the LIVEEZE site
and write tools/marhaba.json (groups, captions, sizes). Source captions come from the
project site's Photo Tour and Front Options pages."""
import json, os, sys
from PIL import Image

SRC = sys.argv[1] if len(sys.argv) > 1 else '/home/claude/marhabamanzil/uploads'
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'website', 'assets', 'projects', 'marhaba-manzil')

GROUPS = [
  ('exterior', 'Exterior & compound', [
    ['Contemporary_villa_with_new_gate_81d5ed8f_2K.jpg', 'From the gate'],
    ['Redesign_front_based_on_floor_470c528e_2K.jpg', 'Front elevation'],
    ['Contemporary_villa_exterior_at_dusk_8ca04fd0_2K.jpg', 'Front at dusk'],
    ['Modern_luxury_villa_exterior_86b7e815_2K.jpg', 'Front three-quarter'],
    ['Contemporary_luxury_villa_exterior_19c501f5_2K.jpg', 'Sitout side'],
    ['Luxury_villa_photograph_in_coastal_3e3a1b59_2K.jpg', 'Left side'],
    ['Contemporary_villa_in_coastal_re..._ced1d291_2K.jpg', 'Rear corner'],
    ['Contemporary_villa_in_coastal_lo..._a7b2f406_2K (1).jpg', 'Rear corner, other side'],
    ['Contemporary_villa_in_coastal_re..._bb527fec_2K.jpg', 'Right side'],
    ['Contemporary_villa_in_coastal_re..._5c21d21a_2K.jpg', 'Rear'],
    ['Contemporary_villa_in_coastal_re..._ca8ae7bd_2K.jpg', 'Side with compound'],
    ['Contemporary_villa_in_coastal_re..._be993712_2K.jpg', 'Front, wide'],
    ['Contemporary_villa_in_coastal_re..._3772632b_2K.jpg', 'Front, close'],
    ['Contemporary_villa_in_coastal_re..._d8d5fc14_2K.jpg', 'Aerial, full plot'],
    ['Contemporary_luxury_villa_aerial..._4c5814aa_2K.jpg', 'Aerial with roof']]),
  ('ground', 'Ground floor interiors', [
    ['Luxury_home_covered_sitout_veranda_1f984bc2_2K.jpg', 'Sitout'],
    ['Living_room_interior_design_3b08641c_2K.jpg', 'Living'],
    ['Dining_and_family_hall_interior_ec6a066d_2K.jpg', 'Dining & family'],
    ['Luxury_dining_area_and_courtyard_cd95bb14_2K.jpg', 'Dining to courtyard'],
    ['Luxury_tropical_resort_courtyard..._f642298a_2K.jpg', 'Courtyard'],
    ['Courtyard_architectural_design_a..._f61b5daf_2K.jpg', 'Courtyard from above'],
    ['Designing_luxury_kitchen_interio..._bcb9e9bb_2K-cead34d1.jpg', 'Kitchen'],
    ['Home_office_interior_layout_179b66ee_2K.jpg', 'Office'],
    ['Prayer_room_entrance_photograph_cd8120db_2K.jpg', 'Prayer room'],
    ['Staircase_passage_in_luxury_home_95b0b9fd_2K.jpg', 'Staircase passage']]),
  ('first', 'First floor interiors', [
    ['Family_lounge_interior_design_a5d05bd1_2K.jpg', 'Family lounge'],
    ['Balcony_sitout_of_luxury_home_9f7dd002_2K.jpg', 'Balcony sitout'],
    ['Bedroom_interior_design_photograph_a61c98cf_2K.jpg', 'Bedroom 1'],
    ['Bedroom_interior_design_photo_80bfb25e_2K.jpg', 'Bedroom 2'],
    ['Bedroom_interior_design_rendering_34d736a6_2K.jpg', 'Bedroom 3'],
    ['Luxury_bedroom_interior_design_d51a2515_2K.jpg', 'Bedroom 4'],
    ['Luxury_bedroom_interior_design_2f95255c_2K.jpg', 'Bedroom 5'],
    ['Luxury_bedroom_interior_design_13a70b15_2K.jpg', 'Guest bedroom']]),
  ('cutaway', 'Open-top 3D views', [
    ['Aerial_floor_plan_house_photograph_1a95e516_2K.jpg', 'Ground floor, top view'],
    ['House_floor_layout_design_585f00dc_2K.jpg', 'Ground floor, angled'],
    ['Floor_plan_of_luxury_home_47ce5a8a_2K.jpg', 'Ground floor in the compound'],
    ['Cutaway_photograph_of_luxury_home_28256da0_2K.jpg', 'Whole house, open top'],
    ['House_floor_plan_aerial_view_cd1f2af7_2K.jpg', 'First floor, open top'],
    ['Aerial_floor_plan_of_luxury_cb06342e_2K.jpg', 'Kitchen & store'],
    ['Cutaway_floor_plan_luxury_home_3889835e_2K.jpg', 'Kitchen, angled'],
    ['Top-down_architectural_cutaway_o..._88f2bc16_2K-ee621b67.jpg', 'Kitchen, store & bath'],
    ['Luxury_home_floor_plan_layout_90547943_2K-68ce151c.jpg', 'Store & bath'],
    ['Luxury_home_cutaway_photograph_9473ea12_2K.jpg', 'Toilet by the stairs'],
    ['Luxury_home_floor_plan_layout_487cb9f4_2K.jpg', 'Toilet by the office'],
    ['Bedroom_interior_design_layout_55e1cba8_2K.jpg', 'Bedroom with baths'],
    ['Bathroom_layout_architectural_ph..._f39f4bda_2K.jpg', 'Dressing & baths'],
    ['Bathroom_layout_floor_plan_view_acfcdd9b_2K.jpg', 'Bath, top view'],
    ['Luxury_bathroom_floor_plan_layout_e2eabe2d_2K.jpg', 'Dressing & bath'],
    ['Luxury_dressing_room_floor_plan_5a338ffd_2K.jpg', 'Dressing room'],
    ['Luxury_home_bathroom_floor_plan_3ad73886_2K.jpg', 'Bedroom bath'],
    ['Luxury_home_dressing_room_layout_2e3e991f_2K.jpg', 'Dressing, top view']]),
  ('fronts', 'Front design options', [
    ['Redesigning_front_structure_9e8caa0f_2K-eca8923f.jpg', 'Wood-lined balcony box · slate stone · pivot door', 'Premium'],
    ['Redesign_front_structure_f4ad3ceb_2K-9660274d.jpg', 'Floating wood canopy · black stone pillars', 'Premium'],
    ['Redesigning_front_structure_aa2f5cea_2K-b4c4c86e.jpg', 'Cream frames · wood fins · planter ledges', 'Premium'],
    ['Redesigning_front_structure_c85e7de2_2K-6e8db2ab.jpg', 'Charcoal box frame · wood louvres · stone pillars', 'Premium'],
    ['A01_Standalone_Render_1.png', 'Blush brick · charcoal frame', 'Flat roof'],
    ['A01_Standalone_Render_2.png', 'Grey brick · wood fins', 'Flat roof'],
    ['Additional_Exterior_13.png', 'Cream brick · wood band', 'Flat roof'],
    ['Additional_Exterior_14.png', 'A-gable · round window · red brick', 'A-gable'],
    ['Additional_Exterior_15.png', 'Mono-pitch glass · red brick', 'Mono-pitch'],
    ['Contemporary House at Dusk-5c752a78.png', 'Stepped boxes · grey stone', 'Stepped'],
    ['Exterior_Concept_01.jpg', 'Charcoal frame · cream stone', 'Flat roof'],
    ['Exterior_Concept_02.jpg', 'Charcoal frame · stone planters', 'Flat roof'],
    ['Exterior_Concept_03.jpg', 'Charcoal frame · lit stone', 'Flat roof'],
    ['Exterior_Concept_04.jpg', 'Charcoal frame · black planters', 'Flat roof'],
    ['Exterior_Concept_05.jpg', 'A-gable glass · shingle roof', 'A-gable'],
    ['Exterior_Concept_06.jpg', 'Charcoal frame · white brick', 'Flat roof'],
    ['Exterior_Concept_07.jpg', 'Charcoal frame · black door', 'Flat roof'],
    ['Exterior_Concept_08.jpg', 'Charcoal frame · lit steps', 'Flat roof'],
    ['Exterior_Concept_09.jpg', 'A-gable glass · siding', 'A-gable'],
    ['Exterior_Concept_10.jpg', 'A-gable · timber vent', 'A-gable'],
    ['Exterior_Concept_11.jpg', 'Charcoal frame · grey entrance', 'Flat roof'],
    ['Exterior_Concept_12.jpg', 'Charcoal frame · dusk', 'Flat roof'],
    ['Remaining_Concept_02.png', 'Brick, wood fins and pergola', 'Stepped'],
    ['Remaining_Concept_04.png', 'A-gable · round window · iron rail', 'A-gable']]),
]

data = []
for key, title, items in GROUPS:
    os.makedirs(os.path.join(OUT, key), exist_ok=True)
    out_items = []
    for i, it in enumerate(items, 1):
        fname, cap = it[0], it[1]
        style = it[2] if len(it) > 2 else None
        big = os.path.join(OUT, key, f'{i:02d}.jpg'); small = os.path.join(OUT, key, f'{i:02d}-s.jpg')
        im = Image.open(os.path.join(SRC, fname)).convert('RGB')
        b = im.copy(); b.thumbnail((1600, 1600), Image.LANCZOS); b.save(big, quality=74, optimize=True, progressive=True)
        s = im.copy(); s.thumbnail((760, 1100), Image.LANCZOS); s.save(small, quality=74, optimize=True, progressive=True)
        rec = {'src': f'/assets/projects/marhaba-manzil/{key}/{i:02d}.jpg', 'thumb': f'/assets/projects/marhaba-manzil/{key}/{i:02d}-s.jpg',
               'w': s.width, 'h': s.height, 'caption': cap}
        if style: rec['style'] = style
        out_items.append(rec)
    data.append({'key': key, 'title': title, 'items': out_items})
    print(key, len(out_items))
json.dump(data, open(os.path.join(HERE, 'marhaba.json'), 'w'), indent=1, ensure_ascii=False)
