import bpy
import os

marker_name = "CodexConnectionMarker"
for obj in list(bpy.data.objects):
    if obj.name == marker_name:
        bpy.data.objects.remove(obj, do_unlink=True)

bpy.ops.mesh.primitive_uv_sphere_add(
    segments=24,
    ring_count=12,
    radius=1.25,
    location=(0.0, 0.0, 1.25),
)
marker = bpy.context.object
marker.name = marker_name

material = bpy.data.materials.get("CodexMarkerMaterial")
if material is None:
    material = bpy.data.materials.new("CodexMarkerMaterial")
material.use_nodes = True
material.diffuse_color = (0.95, 0.12, 0.03, 1.0)
principled = next(node for node in material.node_tree.nodes if node.type == "BSDF_PRINCIPLED")
principled.inputs["Base Color"].default_value = (0.95, 0.12, 0.03, 1.0)
principled.inputs["Metallic"].default_value = 0.15
principled.inputs["Roughness"].default_value = 0.32
marker.data.materials.clear()
marker.data.materials.append(material)

output_path = os.path.abspath(
    "/Users/nabendubiswas/Desktop/Projects/nabendu-blog-site/standalone/dead-shift/art/codex-blender-check.blend"
)
os.makedirs(os.path.dirname(output_path), exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=output_path)
print(f"BLENDER_MARKER_READY name={marker.name} path={output_path}")
