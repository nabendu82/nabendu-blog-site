"""Ground only the existing survivor Run action in the live Blender MCP scene."""
import bpy, math, json, os

ROOT='/Users/nabendubiswas/Desktop/Projects/nabendu-blog-site/standalone/dead-shift'
scene=bpy.data.scenes['Survivor_Rebuild']
bpy.context.window.scene=scene
rig=scene.objects['SurvivorRig']
track=next(t for t in rig.animation_data.nla_tracks if t.name=='Run')
action=bpy.data.actions.new('Survivor_Run_Grounded')
rig.animation_data.action=action

frames=12
for frame in range(1,frames+1):
    t=(frame-1)/(frames-1)
    phase=2*math.pi*t
    for bone in rig.pose.bones:
        bone.rotation_mode='XYZ'
        bone.rotation_euler=(0,0,0)
        bone.location=(0,0,0)
    def rot(name,x=0,y=0,z=0):rig.pose.bones[name].rotation_euler=(x,y,z)
    # The old animation put the ankle at z=.18-.30 while the boot sole is at
    # roughly z=.02. Lower the animated hips (not the world root) and solve
    # each leg toward a .07 m planted ankle, with a modest .10 m swing lift.
    # Pose-bone local Y, rather than Blender world Z, is the rig's up axis.
    rig.pose.bones['Hips'].location.y=-.10
    rot('Spine',.075,math.sin(phase)*.009,math.sin(phase)*.006)
    rot('Head',-.05)
    for side,offset in [('L',0),('R',.5)]:
        cycle=(t+offset)%1
        if cycle<.25:
            dy=-.18+.36*cycle/.25
            ankle_z=.07
        else:
            lift=(cycle-.25)/.75
            smooth=lift*lift*(3-2*lift)
            dy=.18-.36*smooth
            ankle_z=.07+.10*math.sin(math.pi*lift)
        down=.77-ankle_z
        leg1,leg2=.37,.38
        distance2=dy*dy+down*down
        bend=math.acos(max(-1,min(1,(distance2-leg1*leg1-leg2*leg2)/(2*leg1*leg2))))
        shin=-bend
        thigh=math.atan2(dy,down)-math.atan2(leg2*math.sin(shin),leg1+leg2*math.cos(shin))
        rot('Thigh.'+side,thigh)
        rot('Shin.'+side,shin)
        rot('Foot.'+side,-(thigh+shin))
        rot('UpperArm.'+side,math.sin(phase+(0 if side=='L' else math.pi))*.025)
    for bone in rig.pose.bones:
        bone.keyframe_insert('rotation_euler',frame=frame,group=bone.name)
        bone.keyframe_insert('location',frame=frame,group=bone.name)

rig.animation_data.action=None
track.strips[0].action=action
for bone in rig.pose.bones:
    bone.rotation_euler=(0,0,0)
    bone.location=(0,0,0)
old_mute={t.name:t.mute for t in rig.animation_data.nla_tracks}
for t in rig.animation_data.nla_tracks:t.mute=t.name!='Run'
samples=[]
for frame in range(1,frames+1):
    scene.frame_set(frame)
    bpy.context.view_layer.update()
    samples.append([round((rig.matrix_world @ rig.pose.bones[n].matrix).translation.z,3) for n in ('Foot.L','Foot.R')])
for t in rig.animation_data.nla_tracks:t.mute=old_mute[t.name]
scene.frame_set(1)
with bpy.context.temp_override(scene=scene,view_layer=scene.view_layers[0],collection=scene.collection):
    bpy.ops.object.select_all(action='SELECT')
    path=ROOT+'/public/assets/characters/survivor.glb'
    bpy.ops.export_scene.gltf(filepath=path,use_active_scene=True,use_selection=True,export_animation_mode='NLA_TRACKS',export_animations=True,export_force_sampling=True,export_image_format='JPEG',export_image_quality=85)
bpy.ops.wm.save_as_mainfile(filepath=ROOT+'/art/character-rebuild/survivor-walker.blend',copy=True)
print('GROUNDED_RUN_REPORT',json.dumps({'foot_ankle_heights':samples,'export_bytes':os.path.getsize(path),'action':action.name}))
