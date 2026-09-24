import bpy, os, json, bmesh
ROOT='/Users/nabendubiswas/Desktop/Projects/nabendu-blog-site/standalone/dead-shift'
reports=[]
for name,zombie in [('Survivor_Rebuild',False),('Walker_Rebuild',True)]:
    scene=bpy.data.scenes[name]
    bpy.context.window.scene=scene
    with bpy.context.temp_override(scene=scene,view_layer=scene.view_layers[0],collection=scene.collection):
        rig=next(o for o in scene.objects if o.type=='ARMATURE')
        parts=[o for o in scene.objects if o.type=='MESH']
        for obj in parts:
            obj.data.validate();obj.data.update()
            bm=bmesh.new();bm.from_mesh(obj.data);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(obj.data);bm.free()
        bpy.ops.object.select_all(action='DESELECT')
        for obj in parts:obj.select_set(True)
        bpy.context.view_layer.objects.active=parts[0]
        bpy.ops.object.join()
        obj=bpy.context.object; obj.name='WalkerMesh' if zombie else 'SurvivorMesh'
        mod=obj.modifiers.new('Game_mesh_budget','DECIMATE');mod.ratio=.48
        bpy.ops.object.modifier_apply(modifier=mod.name)
        obj.data.validate();obj.data.update()
        # Export only this character's named NLA tracks, never all armature actions.
        for t in rig.animation_data.nla_tracks:t.mute=False
        rig.animation_data.action=None
        rig.select_set(True)
        out=ROOT+('/public/assets/zombies/walker.glb' if zombie else '/public/assets/characters/survivor.glb')
        bpy.ops.export_scene.gltf(filepath=out,use_selection=True,use_active_scene=True,export_animation_mode='NLA_TRACKS',export_animations=True,export_force_sampling=True)
        for t in rig.animation_data.nla_tracks:t.mute=True
        obj.data.calc_loop_triangles()
        reports.append({'name':name,'triangles':len(obj.data.loop_triangles),'bytes':os.path.getsize(out),'clips':[t.name for t in rig.animation_data.nla_tracks]})
bpy.ops.wm.save_as_mainfile(filepath=ROOT+'/art/character-rebuild/survivor-walker.blend',copy=True)
print('FINAL_REPORT',json.dumps(reports))
