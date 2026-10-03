"""Run in the live Blender session through Blender MCP. Creates a separate scene."""
import bpy, math, os
from mathutils import Vector, Quaternion

scene = bpy.data.scenes.new('ROOFTOP_RUSH_COURIER')
bpy.context.window.scene = scene
parts = {}

def mat(name, rgb, metal=0.0, rough=0.4, emission=0):
    m = bpy.data.materials.new('RR_' + name)
    m.use_nodes = True
    node = next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    node.inputs['Base Color'].default_value = (*rgb, 1)
    node.inputs['Metallic'].default_value = metal
    node.inputs['Roughness'].default_value = rough
    if emission:
        node.inputs['Emission Color'].default_value = (*rgb, 1)
        node.inputs['Emission Strength'].default_value = emission
    m.diffuse_color = (*rgb,1)
    return m
orange = mat('Saffron_Armor',(.95,.26,.045),.28,.3)
navy = mat('Graphite_Chassis',(.025,.045,.075),.55,.35)
ivory = mat('Porcelain_Shell',(.84,.9,.91),.18,.3)
steel = mat('Joint_Alloy',(.18,.26,.32),.75,.27)
teal = mat('Teal_Trim',(.025,.55,.54),.4,.3)
glow = mat('Cyan_Optics',(.025,.83,1),.1,.22,2.4)
light = mat('Amber_Signal',(1,.58,.08),.1,.3,1.2)

def pos(p): return (p[0],-p[2],p[1])
def finish(obj, name, part, material):
    obj.name = part + '__' + name
    obj.data.materials.append(material)
    parts.setdefault(part,[]).append(obj)
    return obj

def box(name, part, xyz, size, material, bevel=.035):
    bpy.ops.mesh.primitive_cube_add(size=1, location=pos(xyz))
    o=bpy.context.object
    o.dimensions=(size[0],size[2],size[1])
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    if bevel:
        b=o.modifiers.new('Machined rounded edges','BEVEL');b.width=bevel;b.segments=3
        bpy.ops.object.modifier_apply(modifier=b.name)
    for f in o.data.polygons: f.use_smooth=True
    return finish(o,name,part,material)

def ellipsoid(name,part,xyz,size,material):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=10,radius=1,location=pos(xyz))
    o=bpy.context.object;o.scale=(size[0],size[2],size[1])
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    for f in o.data.polygons:f.use_smooth=True
    return finish(o,name,part,material)

def rod(name,part,a,b,r,material):
    av,bv=Vector(pos(a)),Vector(pos(b)); d=bv-av
    bpy.ops.mesh.primitive_cylinder_add(vertices=12,radius=r,depth=d.length,location=(av+bv)*.5)
    o=bpy.context.object;o.rotation_mode='QUATERNION';o.rotation_quaternion=d.to_track_quat('Z','Y')
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    for f in o.data.polygons:f.use_smooth=True
    return finish(o,name,part,material)

box('Core','Torso',(0,.35,0),(.55,.52,.38),navy,.09)
box('FlightJacket','Torso',(0,.4,-.025),(.65,.49,.43),orange,.105)
box('ChestPlate','Torso',(0,.44,-.255),(.39,.29,.08),ivory,.065)
box('ChestScreen','Torso',(0,.46,-.301),(.24,.12,.023),navy,.022)
box('ChestSignal','Torso',(0,.46,-.316),(.17,.025,.012),glow,.005)
box('UtilityBelt','Torso',(0,.08,0),(.52,.17,.4),navy,.04)
box('BeltBuckle','Torso',(0,.08,-.221),(.15,.11,.05),teal,.02)
rod('Neck','Torso',(0,.63,0),(0,.78,0),.075,steel)
for s in [-1,1]:
    box('Reflector'+str(s),'Torso',(s*.24,.53,-.21),(.055,.24,.035),ivory,.012)
    box('BeltPouch'+str(s),'Torso',(s*.3,.12,.025),(.14,.17,.25),teal,.035)
# Helmet has a broad wraparound visor and a raised protective brow.
ellipsoid('Helmet','Head',(0,.97,0),(.355,.305,.315),ivory)
box('Visor','Head',(0,.98,-.26),(.6,.22,.14),navy,.07)
box('Brow','Head',(0,1.105,-.27),(.64,.06,.15),orange,.023)
for s in [-1,1]:
    box('Optic'+str(s),'Head',(s*.13,1,-.336),(.13,.047,.022),glow,.016)
    ellipsoid('Earpiece'+str(s),'Head',(s*.345,.975,0),(.065,.12,.12),teal)
    box('Cheek'+str(s),'Head',(s*.27,.845,-.16),(.12,.1,.12),orange,.03)
box('HelmetStripe','Head',(0,1.246,.015),(.11,.028,.34),orange,.012)
box('Chin','Head',(0,.772,-.16),(.24,.055,.16),navy,.02)
# Delivery pack remains prominent from the game's chase camera.
box('CargoShell','Pack',(0,.4,.35),(.56,.58,.32),navy,.075)
box('CargoLid','Pack',(0,.42,.52),(.48,.47,.1),orange,.06)
box('ParcelBand','Pack',(0,.45,.578),(.5,.11,.025),ivory,.012)
box('Battery','Pack',(0,.255,.585),(.27,.075,.025),teal,.012)
for i in [-1,0,1]:box('Charge'+str(i),'Pack',(i*.075,.256,.603),(.048,.025,.012),glow,.004)
for s in [-1,1]:
    rod('Thruster'+str(s),'Pack',(s*.235,.12,.41),(s*.235,.45,.41),.065,steel)
    ellipsoid('Exhaust'+str(s),'Pack',(s*.235,.095,.41),(.05,.04,.05),light)
rod('Aerial','Antenna',(.18,.66,.37),(.18,.97,.37),.012,steel)
ellipsoid('AerialLight','Antenna',(.18,.98,.37),(.035,.035,.035),light)
for suffix,s in [('L',-1),('R',1)]:
    shoulder='Shoulder_'+suffix; elbow='Elbow_'+suffix
    ellipsoid('Pivot',shoulder,(s*.4,.58,0),(.11,.11,.11),steel)
    box('ShoulderGuard',shoulder,(s*.445,.55,0),(.18,.21,.29),orange,.065)
    box('UpperArm',shoulder,(s*.4,.41,0),(.135,.25,.16),navy,.045)
    ellipsoid('Hinge',elbow,(s*.4,.24,0),(.08,.08,.08),steel)
    box('Forearm',elbow,(s*.4,.095,0),(.16,.23,.2),ivory,.05)
    box('WristScreen',elbow,(s*.4,.1,-.112),(.085,.095,.025),teal,.018)
    box('Glove',elbow,(s*.4,-.055,-.015),(.17,.12,.19),navy,.045)
    thigh='Thigh_'+suffix; shin='Shin_'+suffix
    ellipsoid('Hip',thigh,(s*.16,0,0),(.105,.11,.1),steel)
    box('ThighGuard',thigh,(s*.16,-.17,0),(.2,.26,.23),orange,.065)
    box('SideStripe',thigh,(s*.16,-.17,-.124),(.08,.17,.025),ivory,.012)
    ellipsoid('Knee',shin,(s*.16,-.34,0),(.095,.08,.095),steel)
    box('ShinGuard',shin,(s*.16,-.505,-.025),(.175,.25,.19),ivory,.05)
    box('ShinTrim',shin,(s*.16,-.52,-.132),(.085,.1,.025),teal,.015)
    box('Sneaker',shin,(s*.16,-.72,-.07),(.24,.15,.37),navy,.055)
    box('ToeCap',shin,(s*.16,-.69,-.205),(.22,.1,.11),orange,.03)
    box('Sole',shin,(s*.16,-.806,-.07),(.245,.035,.38),ivory,.012)
# Join by moving part, preserving the semantic names used by the existing animation rig.
for part,objects in parts.items():
    bpy.ops.object.select_all(action='DESELECT')
    for o in objects:o.select_set(True)
    bpy.context.view_layer.objects.active=objects[0]
    bpy.ops.object.join()
    obj=bpy.context.object;obj.name='Courier_'+part
    bpy.context.scene.cursor.location=(0,0,0)
    bpy.ops.object.origin_set(type='ORIGIN_CURSOR')
    obj['gamePart']=part
for o in scene.objects:o.select_set(True)
for area in bpy.context.screen.areas:
    if area.type=='VIEW_3D':
        area.spaces.active.shading.type='MATERIAL'
        area.spaces.active.region_3d.view_distance=4.6
        area.spaces.active.region_3d.view_location=Vector((0,0,.25))
        # View from front/side and slightly above.
        area.spaces.active.region_3d.view_rotation=Quaternion((.83,.47,.14,.24)).normalized()
print({'scene':scene.name,'parts':[(o.name,len(o.data.polygons)) for o in scene.objects]})
