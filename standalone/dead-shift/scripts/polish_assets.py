"""Add shared small baked surface textures and facade signage to the workshop."""
import bpy, os, random
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
scene=bpy.data.scenes['DEAD_SHIFT_AssetWorkshop']; bpy.context.window.scene=scene
random.seed(194)
for name,base in [('asphalt',(.25,.28,.29)),('concrete',(.56,.57,.53))]:
    m=bpy.data.materials['DS_'+name]
    img=bpy.data.images.new('DS_'+name+'_surface',width=256,height=256)
    pixels=[]
    for i in range(256*256):
        noise=random.uniform(-.055,.055)
        pixels.extend([max(0,c+noise) for c in base]+[1])
    img.pixels.foreach_set(pixels);img.pack()
    p=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
    tex=m.node_tree.nodes.new('ShaderNodeTexImage');tex.image=img
    m.node_tree.links.new(tex.outputs['Color'],p.inputs['Base Color'])
    p.inputs['Roughness'].default_value=.78
def export(obj,name):
    bpy.ops.object.select_all(action='DESELECT');obj.hide_set(False);obj.select_set(True);bpy.context.view_layer.objects.active=obj
    bpy.ops.export_scene.gltf(filepath=os.path.join(ROOT,'public/assets/environment',name+'.glb'),use_selection=True,export_format='GLB',export_animations=False)
for obj,name in [('Intersection','intersection'),('ConcreteBarrier','barrier'),('Debris','debris')]:export(scene.objects[obj],name)
shop=scene.objects['RuinedShop'];texts=[]
for text,loc,size,material in [('NORTHLINE',(-2.6,-2.19,2.63),.54,'paint'),('PHARMACY',(-1.25,-2.19,2.43),.17,'paint'),('EVACUATED',(-.9,-2.14,.85),.22,'orange')]:
    curve=bpy.data.curves.new('Sign','FONT');curve.body=text;curve.size=size;curve.extrude=.002
    o=bpy.data.objects.new('Sign_'+text,curve);scene.collection.objects.link(o);o.location=loc;o.rotation_euler=(1.5707963,0,0);o.data.materials.append(bpy.data.materials['DS_'+material]);texts.append(o)
bpy.ops.object.select_all(action='DESELECT')
for o in texts:o.select_set(True)
bpy.context.view_layer.objects.active=texts[0];bpy.ops.object.convert(target='MESH')
shop.select_set(True);bpy.context.view_layer.objects.active=shop;bpy.ops.object.join();export(shop,'shop')
bpy.data.libraries.write(os.path.join(ROOT,'art/dead-shift.blend'), {scene})
print('Surface and signage exports ready')
