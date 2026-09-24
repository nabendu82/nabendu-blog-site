"""Rebuild the survivor action tracks in the live Blender scene through MCP."""
import bpy, math, os, json
ROOT='/Users/nabendubiswas/Desktop/Projects/nabendu-blog-site/standalone/dead-shift'
scene=bpy.data.scenes['Survivor_Rebuild'];bpy.context.window.scene=scene
rig=next(o for o in scene.objects if o.type=='ARMATURE')
mesh=next(o for o in scene.objects if o.type=='MESH')
if rig.animation_data is None:rig.animation_data_create()
rig.animation_data.action=None
for track in list(rig.animation_data.nla_tracks):rig.animation_data.nla_tracks.remove(track)

for clip in ('Idle','Run','Aim','Shoot','Hit','Death'):
    frames={'Idle':60,'Run':12,'Aim':30,'Shoot':11,'Hit':13,'Death':33}[clip]
    action=bpy.data.actions.new('Survivor_Revised_'+clip)
    rig.animation_data.action=action
    for frame in range(1,frames+1):
        t=(frame-1)/(frames-1);p=2*math.pi*t
        for bone in rig.pose.bones:bone.rotation_mode='XYZ';bone.rotation_euler=(0,0,0);bone.location=(0,0,0)
        def rot(n,x=0,y=0,z=0):rig.pose.bones[n].rotation_euler=(x,y,z)
        if clip in ('Idle','Aim'):
            rot('Spine',.025+math.sin(p)*.007)
            rot('Head',-.015+math.sin(p)*.003)
            if clip=='Aim':rot('Spine',.055)
        elif clip=='Run':
            # For the first quarter of each foot cycle the boot holds ground:
            # 0.36 m of body-relative travel in 0.0625 s at 1.6x playback
            # corresponds to 5.76 m/s, the game's 5.8 m/s base sprint.
            # The remaining cycle lifts and resets the foot.
            rot('Spine',.075,math.sin(p)*.009,math.sin(p)*.006)
            rot('Head',-.05)
            for side,offset in [('L',0),('R',.5)]:
                cycle=(t+offset)%1
                if cycle<.25:
                    dy=-.18+.36*cycle/.25
                    ankle_z=.18
                else:
                    lift=(cycle-.25)/.75
                    smooth=lift*lift*(3-2*lift)
                    dy=.18-.36*smooth
                    ankle_z=.18+.12*math.sin(math.pi*lift)
                down=.87-ankle_z
                leg1=.37;leg2=.38
                dist2=dy*dy+down*down
                bend=math.acos(max(-1,min(1,(dist2-leg1*leg1-leg2*leg2)/(2*leg1*leg2))))
                shin=-bend
                thigh=math.atan2(dy,down)-math.atan2(leg2*math.sin(shin),leg1+leg2*math.cos(shin))
                rot('Thigh.'+side,thigh)
                rot('Shin.'+side,shin)
                rot('Foot.'+side,-(thigh+shin))
                rot('UpperArm.'+side,math.sin(p+(0 if side=='L' else math.pi))*.025)
            rig.pose.bones['Root'].location.z=-.05+.008*(1-math.cos(2*p))
        elif clip=='Shoot':
            impulse=math.sin(math.pi*t)*math.exp(-3*t)
            rot('Spine',.04-.095*impulse)
            rot('UpperArm.L',-.06*impulse);rot('UpperArm.R',-.06*impulse)
            rig.pose.bones['Root'].location.y=.024*impulse
        elif clip=='Hit':
            f=math.sin(math.pi*t)
            rot('Spine',-.16*f,0,.05*f);rot('Head',.07*f)
        elif clip=='Death':
            f=t*t*(3-2*t);rot('Root',-1.48*f,0,.11*f)
            rot('Thigh.L',.25*f);rot('Shin.R',-.30*f)
        for bone in rig.pose.bones:
            bone.keyframe_insert('rotation_euler',frame=frame,group=bone.name)
            bone.keyframe_insert('location',frame=frame,group=bone.name)
    track=rig.animation_data.nla_tracks.new();track.name=clip
    track.strips.new(clip,1,action);track.mute=False
rig.animation_data.action=None
for bone in rig.pose.bones:bone.rotation_euler=(0,0,0);bone.location=(0,0,0)
with bpy.context.temp_override(scene=scene,view_layer=scene.view_layers[0],collection=scene.collection):
    bpy.ops.object.select_all(action='SELECT')
    filepath=ROOT+'/public/assets/characters/survivor.glb'
    bpy.ops.export_scene.gltf(filepath=filepath,use_active_scene=True,use_selection=True,export_animation_mode='NLA_TRACKS',export_animations=True,export_force_sampling=True,export_image_format='JPEG',export_image_quality=85)
mesh.data.calc_loop_triangles()
print('SURVIVOR_MOTION_REPORT',json.dumps({'triangles':len(mesh.data.loop_triangles),'bytes':os.path.getsize(filepath),'clips':[t.name for t in rig.animation_data.nla_tracks]}))
