from GLUtil.Loaders import dshader, dimage
from GLUtil.FrameBufferManager import FrameBuffer
from GLUtil.UniformProvider import UniformProvider
from pyglet import graphics
from pyglet.window import key
from pyglet.gl import GL_TRIANGLES as TRIANGLE
import random

import math
square_2d=('v2i',(-1,-1, 1,-1, -1,1,
                    1,-1, -1,1, 1,1))#note that v2i means int distances with 2 nodes per vertex
class PixelMaterial:
    def __init__(self, name,color, initialState,mobile, max_spread, spread_rate, physicsShader=None):
        self.name=name
        self.color=color
        self.initialState=initialState
        self.mobile=mobile
        self.shader=physicsShader
        self.max_spread=max_spread
        self.spread_rate=spread_rate
class Direction:
    def __init__(self, x, y):
        #range of the atan2 is -pi to pi, starting from positive y axis going left(positive) or right(negative)
        # WE want -1 to 1(that's what we transform input to in shader) starting from negative y axis
        #so... divide by pi, invert y
        self.packed_angle=((math.atan2(x,-y)/math.pi))
        self.stepVector=[float(x),float(y)]
    def __repr__(self):
        return {1.0:'up',-1.0:'down'}.get(self.stepVector[1],'')+{1.0:'right',-1.0:'left'}.get(self.stepVector[0],'')
    def __str__(self):
        return {1.0:'up',-1.0:'down'}.get(self.stepVector[1],'')+{1.0:'right',-1.0:'left'}.get(self.stepVector[0],'')

class WaveStopperGame:
    def __init__(self, levelname, window):
        self.sand=PixelMaterial("sand",[1.0,1.0,0.0],[0.5, 0.0, 0.0, 1.0], True, 1/4, 1/255)
        self.water=PixelMaterial("water",[0.0,0.0,1.0],[0.5, 0.0, 0.0, 0.25],True, 1.0, 15/255)
        self.fixed=PixelMaterial("fixed",[1.0,1.0,1.0],[0.0, 0.0, 0.0, 1.0], False,0,0)
        self.materials=[ self.sand, self.water, self.fixed,]
        self.mobileMaterials=[material for material in self.materials if material.mobile]
        
        self.directions=[ Direction(0,-1),Direction(1,-1), Direction(-1,-1), Direction(-1,0), Direction(1,0),Direction(0,1), Direction(-1,1), Direction(1,1)]
        self.down=self.directions[0]
        self.not_down=self.directions[1:]
        self.ticks=0
        self.time=0
        self.start_texture=dimage(levelname)
        self.blit_shader=dshader('2d','justblit')
        self.update_shader=dshader('2d','updatebuffers')
        self.frame_buffers=[FrameBuffer(self.start_texture.width, self.start_texture.height,window, num_color_attachments=2) for _ in range(2)]
        self.window=window;
        self.setup_initial_frame()
        pass
    def setup_initial_frame(self):
        frame_buffer=self.frame_buffers[0]
        fire_and_forget=dshader('2d','initializeBuffers')
        width=self.start_texture.width
        height=self.start_texture.height
        with fire_and_forget: #construct and dispose a 1 time shader?
            with frame_buffer:
                assert frame_buffer.textures[0].width==self.start_texture.width,"how can they not match??"
                self.window.clear();
                for material in self.materials:
                    with UniformProvider(fire_and_forget, intexture=self.start_texture, targetColor=material.color,colorTolerance=0.1, initialStatusColors=material.initialState):
                        graphics.draw(6,TRIANGLE, square_2d )
            frame_buffer.textures[0].save('setup.png')

    def update(self, dt, pressedkeys):
        
        self.time+=dt
        self.bufferIndex=0
        #random.shuffle(self.not_down)
        #self.window.clear();
        tick_stride=len(self.mobileMaterials) * 3
        mat_stride=3
        with self.update_shader:
            for matIndex, material in enumerate(self.mobileMaterials):
                for dirIndex, direction in enumerate([self.down, random.choice(self.not_down),random.choice(self.not_down)]):

                    bufferIndex=self.ticks*tick_stride+matIndex*mat_stride+dirIndex+1
                    frame_buffer=self.frame_buffers[bufferIndex%len(self.frame_buffers)]
                    prev_frame=self.frame_buffers[(bufferIndex-1)%len(self.frame_buffers)]
                    self.bufferIndex=bufferIndex
                    self.updateSingleMaterial(frame_buffer,prev_frame,material, direction)
                    if key.F10 in pressedkeys:
                        print(f'Ran material {material.name} with color {material.color} on buffer {bufferIndex}({dirIndex},{matIndex},{self.ticks}) for direction {direction}')
                        frame_buffer.textures[0].save(f'frame{self.ticks}-{material.name}-{direction.stepVector}FG.png')
                        frame_buffer.textures[1].save(f'frame{self.ticks}-{material.name}-{direction.stepVector}BG.png')
        self.ticks+=1

    def updateSingleMaterial(self,frame_buffer, prev_frame,material, direction):
        with frame_buffer:
            self.window.clear();#abusive, but window.clear is apparently lazy as hell in pyglet, and will wipe our frame_buffer instead
                
            with UniformProvider(self.update_shader,
                                previous_frame=prev_frame.textures[0], 
                                previous_status=prev_frame.textures[1],
                                size=[float(self.start_texture.width), float(self.start_texture.height)],
                                move_direction=direction.stepVector,
                                move_angle=direction.packed_angle,
                                colorTolerance=0.1, #being within a unit circle 1 wide from the target color is good enough
                                simulatedColor=material.color,
                                spread_rate=material.spread_rate,
                                max_spread=material.max_spread,
                                ):#just have to know that this is how these buffers are arranged
                graphics.draw(6,TRIANGLE, square_2d )
                        
    def draw(self,window):
        frame_buffer=self.frame_buffers[self.bufferIndex%len(self.frame_buffers)]
        window.clear()
        #self.start_texture.blit(0,0,0, 640, 480)
        frame_buffer.textures[0].blit(0,0,0)
        frame_buffer.textures[1].blit(frame_buffer.textures[0].width,0,0)
        #self.start_texture.blit(frame_buffer.textures[0].width,0,0)
        
        #with self.blit_shader:
        #    with UniformProvider(self.blit_shader, intexture=self.start_texture):
        #        graphics.draw(6,TRIANGLE, square_2d )

