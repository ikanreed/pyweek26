from GLUtil.Loaders import dshader, dimage
from GLUtil.FrameBufferManager import FrameBuffer
from GLUtil.UniformProvider import UniformProvider
from pyglet import graphics
from pyglet.gl import GL_TRIANGLES as TRIANGLE
square_2d=('v2i',(-1,-1, 1,-1, -1,1,
                    1,-1, -1,1, 1,1))#note that v2i means int distances with 2 nodes per vertex
class WaveStopperGame:
    def __init__(self, levelname, window):
        self.ticks=0
        self.time=0
        self.start_texture=dimage(levelname)
        self.blit_shader=dshader('2d','justblit')
        self.update_shader=dshader('2d','updatebuffers')
        self.frame_buffers=[FrameBuffer(self.start_texture.width, self.start_texture.height,window, num_color_attachments=2) for _ in range(2)]
        self.setup_initial_frame()
        pass
    def setup_initial_frame(self):
        frame_buffer=self.frame_buffers[0]
        fire_and_forget=dshader('2d','initializeBuffers')
        with fire_and_forget: #construct and dispose a 1 time shader?
            with UniformProvider(fire_and_forget, intexture=self.start_texture):
                with frame_buffer:
                    graphics.draw(6,TRIANGLE, square_2d )

    def update(self, dt):
        self.ticks+=1
        self.time+=dt
        frame_buffer=self.frame_buffers[self.ticks%len(self.frame_buffers)]
        prev_frame=self.frame_buffers[(self.ticks-1)%len(self.frame_buffers)]
        with self.update_shader:
            with frame_buffer:
                with UniformProvider(self.update_shader,previous_frame=prev_frame.textures[0], previous_status=prev_frame.textures[1]):#just have to know that this is how these buffers are arranged
                    graphics.draw(6,TRIANGLE, square_2d )
                    pass
    def draw(self,window):
        frame_buffer=self.frame_buffers[self.ticks%len(self.frame_buffers)]
        window.clear()
        #self.start_texture.blit(0,0,0, 640, 480)
        frame_buffer.textures[0].blit(0,0,0)
        #with self.blit_shader:
        #    with UniformProvider(self.blit_shader, intexture=self.start_texture):
        #        graphics.draw(6,TRIANGLE, square_2d )

