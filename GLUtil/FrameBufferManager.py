from pyglet import gl
from ctypes import byref as rf
from pyglet.image import Texture

class FrameBuffer:
    """provides a way for windows to seemlessly switch between a framebuffered context and a normal self-target context
    does not work without a window width and height are for the texture created
    """
    def __init__(self, width, height, window, num_color_attachments=1, mapping_mode=None, provide_depth=False, provide_stencil=False):
        """"Create an arbitrary layer framebuffer, I'll add stencil and depthbuffers if I ever package this for resuse, in pyweek, those args are pretty much placeholders"""
        if mapping_mode is None:
            mapping_mode=gl.GL_LINEAR
        assert not provide_stencil, 'stencil buffer not implemented'
        assert not provide_depth, 'depth buffer not implemented'
        self.window=window
        self.width=width
        self.height=height
        self.bufferId=gl.GLuint(0)
        self.textureIds=[]
        self.buffer_args=[]
        
        #create the vram objects?
        gl.glGenFramebuffers(1, rf(self.bufferId))
        gl.glBindFramebuffer(gl.GL_FRAMEBUFFER,self.bufferId)

        for bufferIndex in range(num_color_attachments):
            newTex=gl.GLuint(0)
            gl.glGenTextures(1,rf(newTex))
            self.textureIds.append(newTex)
            gl.glBindTexture(gl.GL_TEXTURE_2D,newTex)
            gl.glTexImage2D(gl.GL_TEXTURE_2D,0,gl.GL_RGB,width, height,0, gl.GL_RGB,  gl.GL_UNSIGNED_INT, 0)
            gl.glTexParameteri(gl.GL_TEXTURE_2D, gl.GL_TEXTURE_MAG_FILTER, mapping_mode)
            gl.glTexParameteri(gl.GL_TEXTURE_2D, gl.GL_TEXTURE_MIN_FILTER, mapping_mode)
            gl.glFramebufferTexture2D(gl.GL_FRAMEBUFFER,gl.GL_COLOR_ATTACHMENT0+bufferIndex,gl.GL_TEXTURE_2D,newTex,0)
            self.buffer_args.append(gl.GL_COLOR_ATTACHMENT0+bufferIndex)
        #assign one of the vram objects to the framebuffer cache?
      
        if provide_depth:
            self.buffer_args.append(gl.GL_DEPTH_ATTACHMENT)
        if provide_stencil:
            self.buffer_args.append(gl.GL_STENCIL_ATTACHMENT)

        self.buffers_provided=(gl.GLenum*len(self.buffer_args))(*self.buffer_args)
        
        gl.glDrawBuffers(len(self.buffer_args), self.buffers_provided)
        self.textures=[Texture(self.width, self.height,gl.GL_TEXTURE_2D, texId.value) for texId in self.textureIds]

        assert gl.glCheckFramebufferStatus(gl.GL_FRAMEBUFFER) == gl.GL_FRAMEBUFFER_COMPLETE, "I don't know why this happened, but at least I can find out"


    def __enter__(self):
        gl.glBindFramebuffer(gl.GL_FRAMEBUFFER,self.bufferId)
        gl.glDrawBuffers(len(self.buffer_args), self.buffers_provided)
        gl.glViewport(0,0,self.width, self.height)
        return self
        

    def __exit__(self, type, value, traceback):
        gl.glBindFramebuffer(gl.GL_FRAMEBUFFER, 0)
        gl.glViewport(0,0,self.window.width, self.window.height)
        

