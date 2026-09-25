"""Build ten human-portable firearms in the connected Blender MCP instance.

Run with execute_blender_code. Existing scenes are preserved; each firearm gets
an editable scene and a compact, UV-unwrapped GLB with reference anchors.
"""
import bpy
import math
from pathlib import Path
from mathutils import Vector

ROOT = Path('/Users/nabendubiswas/Desktop/Projects/nabendu-blog-site/standalone/dead-shift')
OUT = ROOT / 'public/assets/weapons'
OUT.mkdir(parents=True, exist_ok=True)


def mat(name, rgb, metal, rough):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.diffuse_color = (*rgb, 1)
    m.use_nodes = True
    bsdf = next(node for node in m.node_tree.nodes if node.type == 'BSDF_PRINCIPLED')
    bsdf.inputs['Base Color'].default_value = (*rgb, 1)
    bsdf.inputs['Metallic'].default_value = metal
    bsdf.inputs['Roughness'].default_value = rough
    return m


PARK = mat('DS parkerized steel', (.105, .12, .113), .74, .58)
BLUE = mat('DS worn blued steel', (.065, .073, .081), .78, .40)
POLY = mat('DS matte black polymer', (.045, .052, .048), .03, .78)
WOOD = mat('DS stained wood furniture', (.29, .15, .075), .0, .69)
RUBBER = mat('DS stock rubber', (.025, .03, .029), .0, .95)
ALLOY = mat('DS brushed receiver edges', (.31, .33, .31), .65, .55)
BRASS = mat('DS cartridge brass', (.55, .37, .14), .7, .48)
GLASS = mat('DS smoked sight glass', (.03, .065, .058), .18, .20)
TAPE = mat('DS survival repair tape', (.17, .17, .13), .0, .91)


def box(name, xyz, dims, material, edge=.002):
    bpy.ops.mesh.primitive_cube_add(size=1, location=xyz)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = dims
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(material)
    if edge:
        bevel = obj.modifiers.new('Soft machined edge', 'BEVEL')
        bevel.width = edge
        bevel.segments = 1
        bevel.affect = 'EDGES'
    return obj


def cyl(name, xyz, radius, length, material, sides=10, along='Y'):
    rotation = (math.pi/2, 0, 0) if along == 'Y' else (0, math.pi/2, 0) if along == 'X' else (0, 0, 0)
    bpy.ops.mesh.primitive_cylinder_add(vertices=sides, radius=radius, depth=length, location=xyz, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(material)
    return obj


def profile(name, yz, width, material):
    n = len(yz)
    verts = [(side*width/2, y, z) for side in (-1, 1) for y, z in yz]
    faces = [tuple(reversed(range(n))), tuple(n+i for i in range(n))]
    faces.extend((i, (i+1)%n, n+(i+1)%n, n+i) for i in range(n))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    mesh.materials.append(material)
    bevel = obj.modifiers.new('Profile edge', 'BEVEL')
    bevel.width = .002
    bevel.segments = 1
    return obj


def anchor(name, xyz):
    obj = bpy.data.objects.new(name, None)
    obj.empty_display_type = 'ARROWS'
    obj.empty_display_size = .055
    bpy.context.scene.collection.objects.link(obj)
    obj.location = xyz


def receiver(name, length=.35, width=.087, stamped=True):
    box(name+' stamped receiver', (0, -.055, .04), (width, length, .12), PARK if stamped else BLUE)
    box(name+' removable top cover', (0, -.065, .108), (width*.95, length*.86, .024), BLUE)
    box(name+' trigger guard', (0, .025, -.078), (.045, .13, .012), ALLOY)
    profile(name+' pistol grip', [( .025,-.02),(.105,-.027),(.088,-.18),(.03,-.19),(-.01,-.13)], .054, POLY)
    box(name+' safety selector', (.052, .007, .055), (.014, .10, .016), ALLOY)
    cyl(name+' charging handle', (.055, .015, .105), .013, .047, BLUE, 8, 'X')
    box(name+' ejection cover', (.048, -.11, .05), (.006, .11, .041), ALLOY)


def barrel(name, front, start=-.30, radius=.015, brake=.040, material=BLUE):
    length = start-front
    cyl(name+' forged barrel', (0, (front+start)/2, .062), radius, length, material, 12)
    cyl(name+' gas block', (0, front+.16, .07), radius*1.7, .045, PARK, 10)
    cyl(name+' muzzle brake', (0, front+.019, .062), radius*1.9, brake, BLUE, 10)
    for x in (-radius*.75, radius*.75):
        box(name+' brake port', (x, front+.011, .064), (.007, .012, .014), RUBBER, 0)


def iron_sights(name, front=-.45):
    box(name+' rear sight base', (0, .035, .135), (.05, .047, .022), BLUE)
    box(name+' rear notch', (0, .035, .160), (.009, .011, .031), PARK)
    box(name+' front sight hood', (0, front, .138), (.043, .028, .045), BLUE)
    box(name+' front post', (0, front, .163), (.006, .012, .026), ALLOY, 0)


def optic(name, y=-.07, long=False):
    box(name+' optic mount', (0, y, .145), (.052, .10, .040), BLUE)
    cyl(name+' optic tube', (0, y, .205), .027 if long else .023, .19 if long else .10, PARK, 12)
    cyl(name+' rear lens', (0, y+(.09 if long else .05), .205), .022, .006, GLASS, 12)
    cyl(name+' front lens', (0, y-(.09 if long else .05), .205), .022, .006, GLASS, 12)
    cyl(name+' turret', (0, y, .239), .013, .018, ALLOY, 10, 'Z')


def curved_mag(name, capacity='30'):
    if capacity == 'drum':
        cyl(name+' steel drum', (0, -.065, -.155), .118, .073, BLUE, 16, 'X')
        cyl(name+' drum hub', (.040, -.065, -.155), .035, .007, PARK, 12, 'X')
        return
    reach = .27 if capacity == '40' else .22
    profile(name+' curved magazine', [(-.15,-.02),(-.06,-.02),(-.045,-reach),(-.105,-reach-.028),(-.152,-.15)], .047, BLUE)
    box(name+' magazine floorplate', (0, -.075, -reach-.026), (.062, .09, .012), PARK)
    for i in range(3):
        box(name+' magazine rib', (.027, -.10+i*.02, -.11-i*.038), (.004, .01, .045), ALLOY, 0)


def box_mag(name, size='standard'):
    h = .23 if size == 'standard' else .29
    profile(name+' detachable box', [(-.16,-.016),(-.04,-.016),(-.038,-h),(-.145,-h)], .064, BLUE)
    box(name+' box base plate', (0, -.09, -h-.005), (.077, .121, .014), PARK)


def stock(name, style='ak', wood=False):
    m = WOOD if wood else POLY
    if style == 'ak':
        profile(name+' shoulder stock', [(.10,.077),(.47,.085),(.48,.015),(.40,-.10),(.31,-.11),(.22,-.017),(.10,-.014)], .053, m)
        box(name+' buttplate', (0, .49, -.014), (.061, .022, .18), RUBBER)
    elif style == 'skeleton':
        box(name+' stock tube', (0, .31, .05), (.052, .39, .055), BLUE)
        profile(name+' adjustable stock', [(.34,.075),(.48,.075),(.50,-.085),(.43,-.095),(.42,.005),(.34,.008)], .066, m)
        box(name+' buttpad', (0, .51, -.008), (.077, .026, .19), RUBBER)
    else:
        profile(name+' cheekpiece stock', [(.10,.078),(.49,.08),(.52,.035),(.50,-.11),(.43,-.12),(.31,-.035),(.10,-.016)], .073, m)
        box(name+' recoil pad', (0, .52, -.016), (.080, .024, .20), RUBBER)
        box(name+' cheek rest', (0, .33, .11), (.062, .25, .036), m)


def handguard(name, front=-.43, wood=False, rail=False):
    m = WOOD if wood else POLY
    center = (front-.20)/2
    box(name+' handguard', (0, center, .047), (.099, -.20-front, .095), m)
    for side in (-1, 1):
        x = side*.052
        for i in range(4):
            box(name+' cooling slot', (x, -.25-i*.045, .070), (.004, .024, .011), BLUE, 0)
    if rail:
        box(name+' sight rail', (0, center, .108), (.052, -.20-front, .012), PARK)
        for i in range(5):
            box(name+' rail tooth', (0, front+.025+i*.05, .119), (.052, .012, .010), ALLOY, 0)


def bipod(name, y):
    for side in (-1, 1):
        cyl(name+' folded bipod leg', (side*.055, y, -.018), .008, .27, PARK, 8)
        box(name+' bipod foot', (side*.055, y-.13, -.02), (.028, .025, .011), RUBBER)


def feed_box(name, large=False):
    box(name+' ammunition box', (.087, -.105, -.087), (.14 if large else .12, .19 if large else .16, .18 if large else .15), PARK)
    box(name+' ammunition box lid', (.087, -.105, .004), (.15 if large else .13, .20 if large else .17, .018), ALLOY)
    box(name+' feed tray cover', (.015, -.093, .129), (.115, .22, .033), BLUE)
    for i in range(5):
        cyl(name+' visible belt link', (.02+i*.018, -.16+i*.011, .117), .009, .018, BRASS, 6, 'X')


def gas_tube(name, front):
    cyl(name+' gas system', (0, (front-.13)/2, .102), .010, -.13-front, PARK, 8)


def tape(name, y):
    box(name+' field tape', (0, y, .047), (.103, .022, .102), TAPE)


def anchors(muzzle, left, shell):
    anchor('Grip_R', (0, .045, -.105))
    anchor('Grip_L', (0, left, .010))
    anchor('Muzzle', (0, muzzle, .062))
    anchor('Stock', (0, .50, .01))
    anchor('Shell_Eject', (.072, shell, .085))


def author(name):
    scene = bpy.data.scenes.new('DEADSHIFT_GROUNDED_' + name.upper().replace('-', '_'))
    bpy.context.window.scene = scene
    tag = name.upper().replace('-', '_')
    if name == 'survivor-ak':
        receiver(tag);stock(tag, wood=True);handguard(tag, -.56, wood=True)
        barrel(tag, -.83);gas_tube(tag, -.62);curved_mag(tag);iron_sights(tag, -.61);tape(tag, -.34)
        anchors(-.85, -.47, -.08)
    elif name == 'rpk':
        receiver(tag, .39, .09);stock(tag, 'solid', True);handguard(tag, -.64, True)
        barrel(tag, -1.02, radius=.018);gas_tube(tag, -.73);curved_mag(tag, 'drum');iron_sights(tag, -.73);bipod(tag, -.69)
        anchors(-1.04, -.57, -.09)
    elif name == 'm249-support':
        receiver(tag, .43, .13, False);stock(tag, 'skeleton');handguard(tag, -.62, rail=True)
        barrel(tag, -.95, radius=.020);feed_box(tag);iron_sights(tag, -.73);bipod(tag, -.60)
        box(tag+' carrying handle', (0, -.10, .225), (.022, .20, .014), PARK)
        for y in (-.19, -.01):box(tag+' handle upright', (0,y,.18), (.019,.015,.09), PARK)
        anchors(-.97, -.52, -.12)
    elif name == 'heavy-gunner':
        receiver(tag, .49, .135, False);stock(tag, 'solid');handguard(tag, -.71, rail=True)
        barrel(tag, -1.13, radius=.023, brake=.058);feed_box(tag, True);iron_sights(tag, -.75);bipod(tag, -.77)
        cyl(tag+' barrel cooling jacket', (0,-.72,.062), .036, .31, PARK, 12)
        for i in range(5):box(tag+' cooling cut', (.036,-.85+i*.052,.063), (.003,.025,.015), RUBBER, 0)
        anchors(-1.16, -.57, -.13)
    elif name == 'breacher':
        receiver(tag, .38, .105, False);stock(tag, 'skeleton');handguard(tag, -.50, rail=True)
        barrel(tag, -.70, radius=.025, brake=.045);cyl(tag+' tube magazine',(0,-.45,-.011),.020,.46,PARK,12)
        iron_sights(tag,-.54);box_mag(tag)
        anchors(-.73, -.41, -.06)
    elif name == 'saiga-12':
        receiver(tag, .40, .105);stock(tag, 'skeleton');handguard(tag, -.57, rail=True)
        barrel(tag, -.81, radius=.026, brake=.050);box_mag(tag, 'large');optic(tag,-.10)
        anchors(-.84, -.47, -.08)
    elif name == 'hellmaker':
        receiver(tag, .43, .12, False);stock(tag, 'skeleton');handguard(tag, -.64, rail=True)
        barrel(tag, -.88, radius=.027, brake=.065);curved_mag(tag,'drum');optic(tag,-.13)
        box(tag+' reinforced side plate', (.066,-.08,.04),(.012,.25,.095),ALLOY)
        box(tag+' recoil compensator', (0,-.87,.090),(.076,.085,.055),PARK)
        anchors(-.94, -.51, -.08)
    elif name == 'svd-hunter':
        receiver(tag, .39, .078);stock(tag, 'solid', True);handguard(tag, -.62, True)
        barrel(tag, -1.08, radius=.016);box_mag(tag);optic(tag,-.06,True);iron_sights(tag,-.70)
        anchors(-1.10, -.55, -.09)
    elif name == 'battle-dmr':
        receiver(tag, .42, .092, False);stock(tag, 'skeleton');handguard(tag, -.71, rail=True)
        barrel(tag, -1.06, radius=.018);box_mag(tag);optic(tag,-.15,True);bipod(tag,-.71)
        anchors(-1.08, -.59, -.10)
    elif name == 'anti-materiel':
        receiver(tag, .52, .12, False);stock(tag, 'solid');handguard(tag, -.75, rail=True)
        barrel(tag, -1.21, radius=.027, brake=.082);box_mag(tag);optic(tag,-.13,True);bipod(tag,-.78)
        box(tag+' bolt handle',(.075,-.055,.096),(.066,.024,.020),ALLOY)
        box(tag+' cheek riser',(0,.35,.15),(.08,.25,.025),RUBBER)
        anchors(-1.26, -.63, -.08)
    else:
        raise ValueError(name)

    meshes = [o for o in scene.objects if o.type == 'MESH']
    bpy.ops.object.select_all(action='DESELECT')
    for obj in meshes:
        bpy.context.view_layer.objects.active = obj
        for mod in list(obj.modifiers):
            bpy.ops.object.modifier_apply(modifier=mod.name)
        obj.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    bpy.ops.object.join()
    gun = bpy.context.object
    gun.name = tag + '_Firearm'
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(island_margin=.02)
    bpy.ops.object.mode_set(mode='OBJECT')
    # The survivor and its existing socket face -Y in Blender. Keep every
    # firearm on that axis and reduce its authored size to the hand rig.
    scene.cursor.location = (0, 0, 0)
    bpy.ops.object.origin_set(type='ORIGIN_CURSOR')
    gun.scale = (.78, .78, .78)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    for helper in (o for o in scene.objects if o.type == 'EMPTY'):
        helper.location *= .78
    all_objects=list(scene.objects)
    bpy.ops.object.select_all(action='DESELECT')
    for obj in all_objects:obj.select_set(True)
    bpy.context.view_layer.objects.active = gun
    path = OUT / (name+'.glb')
    bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,use_active_scene=True,export_animations=False,export_apply=True)
    triangles=sum(len(p.vertices)-2 for p in gun.data.polygons)
    coords=[gun.matrix_world@Vector(corner) for corner in gun.bound_box]
    bounds=[(round(min(v[i] for v in coords),3),round(max(v[i] for v in coords),3)) for i in range(3)]
    print('FIREARM',name,'TRIANGLES',triangles,'BYTES',path.stat().st_size,'BOUNDS',bounds,'ANCHORS',[(o.name,tuple(round(v,3) for v in o.location)) for o in all_objects if o.type=='EMPTY'])


for name in ('survivor-ak','rpk','m249-support','heavy-gunner','breacher','saiga-12','hellmaker','svd-hunter','battle-dmr','anti-materiel'):
    author(name)
