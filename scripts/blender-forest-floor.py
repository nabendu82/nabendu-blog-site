import bpy, math, random
from mathutils import Vector, Quaternion
rng = random.Random(472)
collection = bpy.data.collections.new("Monsoon_Forest_Assets")
bpy.context.scene.collection.children.link(collection)
def material(name, color):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    node = next(n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    node.inputs['Base Color'].default_value = (*color, 1)
    node.inputs['Roughness'].default_value = 0.93
    mat.diffuse_color = (*color, 1)
    return mat
fern = material('Monsoon_Fern_Green', (0.075, 0.22, 0.035))
moss = material('Monsoon_Moss', (0.09, 0.14, 0.04))
stone = material('Monsoon_Wet_Stone', (0.12, 0.14, 0.10))
verts, faces = [], []
for frond in range(9):
    angle = frond * math.tau / 9
    length = rng.uniform(.8, 1.3)
    def point(t):
        return Vector((math.cos(angle)*length*t, math.sin(angle)*length*t, .07 + math.sin(t*2.3)*length*.62))
    side = Vector((-math.sin(angle), math.cos(angle), 0))
    for i in range(1, 14):
        t = i / 14
        center = point(t)
        width = math.sin(t*math.pi)**.8 * .24
        for sign in [-1,1]:
            tip = center + side*width*sign + (point(min(1,t+.07))-center)
            middle = (center+tip)*.5
            k=len(verts)
            verts += [tuple(center), tuple(middle + Vector((0,0,.025))), tuple(tip), tuple(middle - Vector((0,0,.018)))]
            faces += [(k,k+1,k+2),(k,k+2,k+3)]
    for i in range(14):
        a,b=point(i/14),point((i+1)/14)
        k=len(verts)
        verts += [tuple(a-side*.008),tuple(a+side*.008),tuple(b+side*.004),tuple(b-side*.004)]
        faces.append((k,k+1,k+2,k+3))
mesh=bpy.data.meshes.new('Monsoon_Fern_Fronds')
mesh.from_pydata(verts,[],faces); mesh.update()
obj=bpy.data.objects.new('Monsoon_Fern_Cluster',mesh);collection.objects.link(obj)
obj.data.materials.append(fern)
# Faceted mossy rock beneath the fern, constructed without disturbing existing scene meshes.
verts,faces=[],[]
rings=4; sides=11
for j in range(rings):
    z=[-.04,.08,.23,.29][j]
    radius=[.39,.5,.4,.15][j]
    for i in range(sides):
        a=i*math.tau/sides; r=radius*rng.uniform(.85,1.15)
        verts.append((math.cos(a)*r+.18,math.sin(a)*r-.13,z+rng.uniform(-.025,.025)))
for j in range(rings-1):
    for i in range(sides):
        faces.append((j*sides+i,j*sides+(i+1)%sides,(j+1)*sides+(i+1)%sides,(j+1)*sides+i))
faces.append(tuple(range((rings-1)*sides,rings*sides)))
mesh=bpy.data.meshes.new('Monsoon_Moss_Rock_Mesh');mesh.from_pydata(verts,[],faces);mesh.update()
rock=bpy.data.objects.new('Monsoon_Moss_Rock',mesh);collection.objects.link(rock)
mesh.materials.append(stone);mesh.materials.append(moss)
for p in mesh.polygons: p.material_index=1 if p.center.z>.12 else 0
previous_selection=list(bpy.context.selected_objects)
for o in previous_selection:o.select_set(False)
obj.select_set(True);rock.select_set(True);bpy.context.view_layer.objects.active=obj
print('Default export format:', bpy.ops.export_scene.gltf.get_rna_type().properties['export_format'].default)
bpy.ops.export_scene.gltf(filepath='/Users/nabendubiswas/Desktop/Projects/nabendu-blog-site/public/models/forest/fern-rock.glb',use_selection=True,export_animations=False)
for area in bpy.context.screen.areas:
    if area.type=='VIEW_3D':
        region=area.spaces.active.region_3d
        region.view_location=Vector((0,0,.4));region.view_distance=3.8
        region.view_rotation=Quaternion((.88,.34,.12,.28)).normalized()
print('Created:',obj.name,rock.name)
