import bpy, os, json
ROOT='/Users/nabendubiswas/Desktop/Projects/nabendu-blog-site/standalone/dead-shift'
reports=[]
for name,asset in [('Survivor_Rebuild','characters/survivor'),('Walker_Rebuild','zombies/walker')]:
    scene=bpy.data.scenes[name];bpy.context.window.scene=scene
    with bpy.context.temp_override(scene=scene,view_layer=scene.view_layers[0],collection=scene.collection):
        rig=next(o for o in scene.objects if o.type=='ARMATURE')
        mesh=next(o for o in scene.objects if o.type=='MESH')
        bpy.ops.object.select_all(action='SELECT')
        for track in rig.animation_data.nla_tracks:track.mute=False
        path=ROOT+'/public/assets/'+asset+'.glb'
        bpy.ops.export_scene.gltf(filepath=path,use_selection=True,use_active_scene=True,export_animation_mode='NLA_TRACKS',export_animations=True,export_force_sampling=True,export_image_format='JPEG',export_image_quality=85,export_jpeg_quality=85)
        for track in rig.animation_data.nla_tracks:track.mute=True
        mesh.data.calc_loop_triangles()
        reports.append({'asset':asset,'triangles':len(mesh.data.loop_triangles),'bytes':os.path.getsize(path),'clips':[t.name for t in rig.animation_data.nla_tracks]})
bpy.data.libraries.write(ROOT+'/art/character-rebuild/survivor-walker.blend',{bpy.data.scenes[n] for n in ['Survivor_Rebuild','Walker_Rebuild','Survivor_Rifle']})
print('PACKAGED_REPORT',json.dumps(reports))
