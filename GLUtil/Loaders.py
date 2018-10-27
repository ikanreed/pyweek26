import ratcave as rc
from pyglet import image


class Loader:
    def __init__(self, shader_folder, image_folder, audio_folder, music_folder):
        self.shader_folder=shader_folder
        self.image_folder=image_folder
        self.audio_folder=audio_folder
        self.music_folder=music_folder
    def load_shader(self,vertname, fragname):
        return rc.Shader.from_file(f'{self.shader_folder}/{vertname}.vert',f'{self.shader_folder}/{fragname}.frag')
    def load_image(self, name):
        return image.load(f'{self.image_folder}/{name}.png').get_texture()
    #skip audio and music for now

default_loader=Loader('content/shaders', 'content/images','content/audio','content/music')
dshader=default_loader.load_shader
dimage=default_loader.load_image

    
