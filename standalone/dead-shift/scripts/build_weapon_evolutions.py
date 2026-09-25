"""Author six DEAD//SHIFT evolution guns in the connected Blender MCP scene."""
import bpy
import math
from pathlib import Path

OUT = Path('/Users/nabendubiswas/Desktop/Projects/nabendu-blog-site/standalone/dead-shift/public/assets/weapons')
OUT.mkdir(parents=True, exist_ok=True)


def material(name, color, metallic=0.2, emission=0.0):
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    bsdf = next(n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    bsdf.inputs['Base Color'].default_value = (*color, 1)
    bsdf.inputs['Metallic'].default_value = metallic
    bsdf.inputs['Roughness'].default_value = .32 if metallic else .5
    bsdf.inputs['Emission Color'].default_value = (*color, 1)
    bsdf.inputs['Emission Strength'].default_value = emission
    return mat


dark = material('DS Gunmetal', (.055, .074, .092), .75)
steel = material('DS Machined Titanium', (.27, .33, .38), .85)
black = material('DS Carbon Grip', (.025, .031, .035), .12)
gold = material('DS Brass Contacts', (.49, .29, .10), .72)
electric = material('DS Arc Plasma', (.10, .73, 1.0), .12, 3.0)
fire = material('DS Molten Core', (1.0, .20, .025), .08, 3.0)
ice = material('DS Cryo Light', (.44, .90, 1.0), .10, 2.5)
white = material('DS Frost Ceramic', (.60, .77, .84), .24)


def cube(name, at, size, mat, bevel=.025):
    bpy.ops.mesh.primitive_cube_add(size=1, location=at)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        mod = obj.modifiers.new('Machined edge', 'BEVEL')
        mod.width = bevel
        mod.segments = 2
        obj.modifiers.new('Weighted normals', 'WEIGHTED_NORMAL')
    obj.data.materials.append(mat)
    return obj


def cyl(name, at, radius, depth, mat, vertices=12):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=at, rotation=(math.pi/2, 0, 0))
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(mat)
    return obj


def ring(name, at, major, minor, mat):
    bpy.ops.mesh.primitive_torus_add(major_segments=16, minor_segments=6, location=at, rotation=(math.pi/2, 0, 0), major_radius=major, minor_radius=minor)
    bpy.context.object.name = name
    bpy.context.object.data.materials.append(mat)


def crystal(name, at, radius, length, mat):
    bpy.ops.mesh.primitive_cone_add(vertices=6, radius1=radius, radius2=0, depth=length, location=at, rotation=(math.pi/2, 0, 0))
    bpy.context.object.name = name
    bpy.context.object.data.materials.append(mat)


def standard_body(label, tier, accent):
    width = .33 + tier*.045
    cube(label + ' / receiver', (0, 0, 0), (width, .75+tier*.1, .24+tier*.02), dark)
    cube(label + ' / upper armor', (0, .09, .17), (width*.86, .62+tier*.08, .11), steel)
    cube(label + ' / shoulder stock', (0, -.57, .025), (.28+tier*.035, .48, .15), steel)
    cube(label + ' / butt pad', (0, -.85, .02), (.38+tier*.025, .08, .22), black)
    cube(label + ' / pistol grip', (0, -.23, -.23), (.13, .15, .34), black)
    cube(label + ' / foregrip', (0, .34, -.18), (.16, .22, .24), black)
    cube(label + ' / power magazine', (0, -.05, -.26), (.24+tier*.02, .31, .21), accent)
    for x in (-1, 1):
        cube(label + ' / side rail', (x*(width/2+.025), .12, .12), (.045, .8+tier*.13, .055), gold)
    cyl(label + ' / reactor', (0, .22, 0), .18+tier*.023, .33, accent)
    ring(label + ' / reactor brace', (0, .01, 0), .21+tier*.023, .035, steel)
    ring(label + ' / reactor brace', (0, .42, 0), .21+tier*.023, .035, steel)


def electric_gun(label, tier):
    standard_body(label, tier, electric)
    count = 3 if tier == 2 else 5
    radius = .14 if tier == 2 else .17
    for i in range(count):
        angle = 2*math.pi*i/count
        x, z = math.cos(angle)*radius, math.sin(angle)*radius
        cyl(label + f' / barrel {i+1}', (x, .70+tier*.09, z), .052, .88+tier*.10, steel)
        cyl(label + f' / muzzle glow {i+1}', (x, 1.17+tier*.14, z), .035, .09, electric)
    for y in (.39, .53, .67, .81, .95):
        ring(label + ' / induction coil', (0, y, 0), .25+tier*.027, .026, gold if int(y*100)%2 else electric)
    for side in (-1, 1):
        x = side*(.29+tier*.045)
        cube(label + ' / arc fin', (x, .44, .06), (.08, .67+tier*.13, .27), dark)
        cube(label + ' / arc conductor', (x, .44, .22), (.034, .47+tier*.13, .045), electric)
        if tier == 3:
            cyl(label + ' / thunder rod', (x, .62, .20), .045, .96, steel)
            crystal(label + ' / discharge tip', (x, 1.17, .20), .07, .18, electric)
    if tier == 3:
        cyl(label + ' / god core', (0, -.16, .29), .15, .22, electric)
        for x in (-.36, .36):
            cube(label + ' / wing brace', (x, -.01, .12), (.09, .45, .28), steel)


def fire_gun(label, tier):
    standard_body(label, tier, fire)
    barrel_radius = .18 if tier == 2 else .23
    cyl(label + ' / siege barrel', (0, .84, .02), barrel_radius, .98+tier*.13, steel, 12)
    cyl(label + ' / infernal bore', (0, 1.42+tier*.12, .02), barrel_radius*.69, .08, black)
    ring(label + ' / burning muzzle', (0, 1.48+tier*.12, .02), barrel_radius*.81, .045, fire)
    for side in (-1, 1):
        x = side*(.30+tier*.05)
        cube(label + ' / heat shield', (x, .52, -.015), (.12, .92+tier*.12, .32), dark)
        for i in range(4+tier):
            cube(label + ' / vent', (x+side*.065, .18+i*.15, .10), (.035, .09, .12), fire)
        cyl(label + ' / exhaust pipe', (x, -.04, .26), .08, .45, steel)
    for y in (.30, .56, .82):
        ring(label + ' / overpressure clamp', (0, y, .02), barrel_radius+.045, .04, gold)
    if tier == 3:
        for x in (-.19, .19):
            cyl(label + ' / outer plasma lance', (x, 1.0, -.18), .07, 1.0, fire)
        cyl(label + ' / exposed apocalypse core', (0, -.12, .31), .20, .27, fire)
        for side in (-1, 1):
            cube(label + ' / reactor cage', (side*.22, -.12, .31), (.055, .47, .30), gold)


def cryo_gun(label, tier):
    standard_body(label, tier, ice)
    for side in (-1, 1):
        x = side*(.17+tier*.025)
        cube(label + ' / long rail', (x, .78, .11), (.095, 1.34+tier*.15, .19), white)
        cube(label + ' / rail conduit', (x, .76, .22), (.04, 1.20+tier*.15, .055), ice)
        for i in range(4+tier):
            crystal(label + ' / ice tooth', (x, .25+i*.19, -.11), .065, .15, ice)
    cyl(label + ' / cryo bore', (0, .90, .05), .095, 1.48+tier*.15, dark)
    cyl(label + ' / cold emitter', (0, 1.65+tier*.16, .05), .075, .13, ice)
    for y in (.39, .69, .99, 1.29):
        cube(label + ' / rail clamp', (0, y, .15), (.39+tier*.06, .07, .12), steel)
    for side in (-1, 1):
        cyl(label + ' / coolant flask', (side*.29, -.23, .14), .09, .34, ice)
    if tier == 3:
        crystal(label + ' / zero point crown', (0, -.08, .36), .20, .37, ice)
        for side in (-1, 1):
            cube(label + ' / stabilizer fin', (side*.37, .67, -.06), (.08, .83, .25), white)
            crystal(label + ' / stabilizer crystal', (side*.38, 1.14, -.06), .1, .27, ice)


def author(name, branch, tier):
    scene = bpy.data.scenes.new('DEADSHIFT_' + name.upper().replace('-', '_'))
    bpy.context.window.scene = scene
    if branch == 'volt': electric_gun(name.upper(), tier)
    elif branch == 'fire': fire_gun(name.upper(), tier)
    else: cryo_gun(name.upper(), tier)
    meshes = [obj for obj in scene.objects if obj.type == 'MESH']
    bpy.ops.object.select_all(action='DESELECT')
    for obj in meshes: obj.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    path = OUT / (name + '.glb')
    bpy.ops.export_scene.gltf(filepath=str(path), export_format='GLB', use_selection=True, use_active_scene=True, export_animations=False, export_apply=True)
    print('EXPORTED', path, 'meshes', len(meshes), 'bytes', path.stat().st_size)


for name, branch, tier in (
    ('tempest', 'volt', 2), ('storm-god', 'volt', 3),
    ('inferno-breaker', 'fire', 2), ('apocalypse-core', 'fire', 3),
    ('permafrost', 'cryo', 2), ('zero-point', 'cryo', 3),
):
    author(name, branch, tier)
