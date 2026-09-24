"""DEAD//SHIFT Phase 2 modular character family and weapon mutations."""
import bpy, math, os, runpy
BASE=os.path.dirname(os.path.abspath(__file__))
lib=runpy.run_path(os.path.join(BASE,'build_assets.py'),run_name='phase2_library')
box,cyl,join,export,mat=lib['box'],lib['cyl'],lib['join'],lib['export'],lib['mat']
scene,materials,parts,ROOT=lib['scene'],lib['materials'],lib['parts'],lib['ROOT']
mat('survivor_cloth',(.055,.12,.13));mat('armor',(.16,.20,.20),.72,.34);mat('webbing',(.24,.19,.11));mat('infected_dark',(.23,.35,.25));mat('hazmat',(.56,.46,.055));mat('hazmat_dark',(.10,.13,.12));mat('toxic',(.35,1,.18),0,.25,4);mat('volt',(.08,.65,1),.35,.2,5);mat('firecore',(1,.18,.025),.25,.25,5);mat('cryo',(.55,.92,1),.4,.18,4);mat('mass',(.46,.18,.52),.35,.3,3)

def sphere(name,loc,scale,material,bone=None):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2,radius=1,location=loc);o=bpy.context.object;o.name=name;o.scale=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(materials[material]);parts.append(o)
    if bone:g=o.vertex_groups.new(name=bone);g.add(list(range(len(o.data.vertices))),1,'REPLACE')
    return o

def rig_and_export(name,folder,clips,speed=32,lean=.12):
    mesh=join(name.title().replace('-',''))
    rigdata=bpy.data.armatures.new(name.title()+'Rig');rig=bpy.data.objects.new(name.title()+'Rig',rigdata);scene.collection.objects.link(rig)
    bpy.context.view_layer.objects.active=rig;rig.select_set(True);bpy.ops.object.mode_set(mode='EDIT')
    bones=[('Root',(0,0,0),(0,0,.3),None),('Spine',(0,0,.92),(0,0,1.62),'Root'),('Head',(0,0,1.62),(0,0,2.13),'Spine'),('LegL',(-.23,0,.94),(-.23,0,.18),'Root'),('LegR',(.23,0,.94),(.23,0,.18),'Root'),('ArmL',(-.43,0,1.53),(-.48,-.53,1.18),'Spine'),('ArmR',(.43,0,1.53),(.48,-.53,1.18),'Spine')]
    for bn,h,t,parent in bones:
        b=rigdata.edit_bones.new(bn);b.head=h;b.tail=t
        if parent:b.parent=rigdata.edit_bones[parent]
    bpy.ops.object.mode_set(mode='OBJECT');mesh.parent=rig;mod=mesh.modifiers.new('DeformRig','ARMATURE');mod.object=rig;rig.animation_data_create()
    for clip in clips:
        action=bpy.data.actions.new(clip);rig.animation_data.action=action;duration=speed if clip in ('Run','Walk') else 46 if clip=='Idle' else 26
        for frame in range(1,duration+1,2):
            t=(frame-1)/(duration-1);wave=math.sin(t*math.pi*2);pulse=math.sin(t*math.pi)
            for b in rig.pose.bones:b.rotation_mode='XYZ';b.rotation_euler=(0,0,0);b.location=(0,0,0);b.scale=(1,1,1)
            if clip in ('Run','Walk'):
                stride=.9 if clip=='Run' else .55;rig.pose.bones['LegL'].rotation_euler.x=wave*stride;rig.pose.bones['LegR'].rotation_euler.x=-wave*stride;rig.pose.bones['Spine'].rotation_euler.x=lean;rig.pose.bones['Spine'].rotation_euler.z=wave*.09;rig.pose.bones['Spine'].location.z=abs(wave)*.07;rig.pose.bones['Head'].rotation_euler.z=-wave*.06;rig.pose.bones['ArmL'].rotation_euler.x=-wave*.25;rig.pose.bones['ArmR'].rotation_euler.x=wave*.25
            elif clip=='Idle':rig.pose.bones['Spine'].scale=(1,1,1+wave*.018);rig.pose.bones['Head'].rotation_euler.z=wave*.025
            elif clip in ('Shoot','Attack'):rig.pose.bones['Spine'].rotation_euler.x=(-.20 if clip=='Shoot' else .42)*pulse;rig.pose.bones['Spine'].location.y=-.07*pulse;rig.pose.bones['ArmL'].rotation_euler.x=-.36*pulse;rig.pose.bones['ArmR'].rotation_euler.x=-.46*pulse
            elif clip=='Hit':rig.pose.bones['Spine'].rotation_euler.z=.42*pulse;rig.pose.bones['Head'].rotation_euler.z=-.22*pulse
            elif clip=='Death':rig.pose.bones['Root'].rotation_euler.x=-min(t*2,1)*1.52;rig.pose.bones['Root'].location.z=-min(t*2,1)*.1
            for b in rig.pose.bones:
                b.keyframe_insert(data_path='rotation_euler',frame=frame);b.keyframe_insert(data_path='location',frame=frame);b.keyframe_insert(data_path='scale',frame=frame)
        track=rig.animation_data.nla_tracks.new();track.name=clip;track.strips.new(clip,1,action);rig.animation_data.action=None
    scene.frame_set(1);export(folder,name,[mesh,rig],True);return mesh,rig

def survivor():
    box('Layered torso',(0,0,1.31),(.69,.39,.69),'survivor_cloth',.1,'Spine');box('Tactical chest plate',(0,-.255,1.36),(.56,.15,.43),'armor',.07,'Spine');box('Scavenger backpack',(0,.31,1.34),(.51,.28,.56),'cloth',.08,'Spine');box('Bedroll',(0,.36,1.79),(.48,.20,.15),'webbing',.06,'Spine');cyl('Radio antenna',(.3,.46,1.82),.025,.58,'steel',(0,0,.16),'Spine')
    box('Utility belt',(0,0,.94),(.64,.4,.13),'boots',.025,'Spine');[box('Utility pouch',(x,-.34,1.02),(.14,.11,.18),'webbing',.025,'Spine') for x in (-.22,0,.22)]
    sphere('Head',(0,-.03,1.9),(.37,.34,.43),'skin','Head');box('Hood',(0,.08,1.99),(.42,.31,.30),'cloth',.08,'Head');box('Goggles',(0,-.34,1.99),(.35,.05,.105),'glass',.02,'Head');box('Respirator',(0,-.36,1.80),(.23,.10,.16),'armor',.04,'Head')
    for side,x in [('L',-.47),('R',.47)]:
        box('Shoulder pad '+side,(x,0,1.55),(.28,.42,.23),'armor',.08,'Arm'+side);box('Arm '+side,(x,-.12,1.34),(.22,.28,.4),'survivor_cloth',.06,'Arm'+side);box('Glove '+side,(x,-.55,1.18),(.20,.22,.18),'boots',.05,'Arm'+side);box('Trouser '+side,(x*.5,0,.65),(.26,.31,.63),'cloth',.06,'Leg'+side);box('Boot '+side,(x*.5,-.12,.17),(.30,.48,.30),'boots',.07,'Leg'+side);box('Knee plate '+side,(x*.5,-.20,.57),(.23,.09,.23),'armor',.035,'Leg'+side)
    rig_and_export('survivor','characters',['Idle','Run','Shoot','Hit','Death'],28,.13)

def infected(kind):
    tank=kind=='tank';runner=kind=='runner';hazmat=kind=='hazmat';w=1.28 if tank else .82 if runner else 1;h=.94 if tank else 1.05 if runner else 1
    coat='hazmat' if hazmat else 'infected_dark';skin='infected';box('Infected torso',(0,0,1.3*h),(.66*w,.37*w,.66*h),coat,.09,'Spine');box('Ripped chest',(0,-.25*w,1.35*h),(.48*w,.10,.34*h),'rust',.04,'Spine')
    if tank:[sphere('Tumor',(sx,.26,1.5),(.27,.25,.3),'mass','Spine') for sx in (-.43,.42)]
    if hazmat:box('Air tank',(0,.34,1.36),(.35,.24,.5),'hazmat_dark',.07,'Spine');cyl('Toxic canister',(.29,.34,1.25),.12,.55,'toxic',(0,0,0),'Spine')
    sphere('Head',(0,-.04,1.9*h),(.37*w,.34*w,.43*h),'infected','Head')
    if hazmat:sphere('Broken visor',(0,-.15,1.93),(.44,.37,.45),'hazmat', 'Head');box('Visor crack',(0,-.49,1.93),(.28,.025,.15),'toxic',.01,'Head')
    else:box('Split jaw',(0,-.34,1.76*h),(.25*w,.10,.14),'rust',.035,'Head');box('Infected eyes',(0,-.37,1.98*h),(.23*w,.035,.055),'eyes',.01,'Head')
    for side,sx in [('L',-1),('R',1)]:
        x=.46*w*sx;armw=.31 if tank else .19 if runner else .23;box('Shoulder '+side,(x,0,1.5*h),(armw,.29*w,.30*h),coat,.07,'Arm'+side);box('Forearm '+side,(x,-.35,1.22*h),(armw*.9,.48,.22*h),skin,.06,'Arm'+side);box('Claw '+side,(x,-.66,1.14*h),(armw,.22,.16),'infected',.04,'Arm'+side);lx=.23*w*sx;box('Leg '+side,(lx,0,.64*h),(.24*w,.29,.62*h),coat,.055,'Leg'+side);box('Foot '+side,(lx,-.13,.16),(.28*w,.47,.28),'boots',.06,'Leg'+side)
    rig_and_export(kind,'zombies',['Idle','Walk','Attack','Hit','Death'],20 if runner else 40 if tank else 32,.30 if runner else .12)

def weapon(name,element):
    core={'volt':'volt','fire':'firecore','cryo':'cryo'}[element];box('Evolved receiver',(0,0,0),(.24,.5,.25),'armor',.055);box('Reinforced stock',(0,.42,-.01),(.19,.42,.21),'boots',.05);box('Energy core',(0,-.03,.04),(.18,.22,.18),core,.04)
    if name=='thunderstorm':
        for x in (-.12,0,.12):cyl('Rotary barrel',(x,-.72,.02),.045,.72,'steel',(math.pi/2,0,0))
        cyl('Barrel cage',(0,-.56,.02),.22,.48,'armor',(math.pi/2,0,0));box('Capacitor',(.23,-.12,.02),(.12,.25,.2),core,.035)
    elif name=='hellbreaker':
        for x in (-.13,.13):cyl('Blast tube',(x,-.64,.02),.105,.7,'rust',(math.pi/2,0,0))
        box('Heat shroud',(0,-.42,.04),(.33,.52,.29),'armor',.055);box('Ignition chamber',(0,-.2,-.22),(.21,.22,.26),core,.04)
    else:
        cyl('Cryo rail',(0,-.83,.03),.075,1.25,'steel',(math.pi/2,0,0));box('Upper rail',(0,-.56,.16),(.12,.8,.09),'cryo',.025);box('Lower rail',(0,-.56,-.10),(.12,.8,.07),'armor',.02);cyl('Cryo flask',(.22,-.12,.02),.11,.45,core)
    mesh=join(name.title().replace('-',''));export('weapons',name,[mesh])

survivor();infected('walker');infected('runner');infected('tank');infected('hazmat');weapon('thunderstorm','volt');weapon('hellbreaker','fire');weapon('absolute-zero','cryo')
for o in scene.objects:o.hide_set(False)
bpy.data.libraries.write(os.path.join(ROOT,'art','phase2-characters-weapons.blend'),{scene})
print('DEAD_SHIFT_PHASE2_ASSETS_READY')
