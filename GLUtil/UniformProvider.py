from ctypes import  ARRAY
from ctypes import  c_char_p
from pyglet.image import Texture
from pyglet import gl

class UniformProvider:
    """Provides a wraped mechanism of setting uniforms in ratcave shaders
    intended use is to create a instance in a with statement like 
    with UniformProvider(shader, varname=value):
        somecode
    but you can use persistently if you've got a usecase for that, and hence the use of __call__
    """
    def __init__(self, target_shader, value_dictionary={}, **values):
        """provide EITHER a dictionary or keyword values, not both, supports floats, ints, textures and arrays of each"""
        self.shader=target_shader
        self.values=value_dictionary or values
        self._currentTextureLocation=0
        self.bound_textures=False
    def SupplyValues(self):
        self._currentTextureLocation=0
        for key, value in self.values.items():

            location=None
            if isinstance(key, gl.GLuint):
                location=key
            elif isinstance(key, int):
                location=gl.GLunit(key)
            else:
                location=gl.glGetUniformLocation(gl.GLuint(self.shader.id), str(key).encode('ascii'))
            self.invokeSetter(location,value)
            #this only allows arrays and vectors of primitives, matrices are yet to handle
    def invokeSetter(self,location, value):
        
        if hasattr(value, '__call__'):
            try:
                value=value()
            except:
                pass
        
        if isinstance(value,Texture):
            
            textureUnit=gl.GL_TEXTURE0+self._currentTextureLocation
            gl.glActiveTexture(textureUnit)
            gl.glBindTexture(gl.GL_TEXTURE_2D,value.id)
            gl.glUniform1i(location,self._currentTextureLocation)
            self.bound_textures=True
            self._currentTextureLocation+=2#allow for space between textures
            return


        try:
            length=len(value)
            try:
                sublength=len(value[0])
                gltype=getGLType(value[0][0])
                arr=ARRAY(gltype, length*sublength)
                for index,subval in enumerate((x for x in y for y in value)):
                    arr[index]=gltype(value)
                self.getSetter(gltype,sublength,True)(location, arr)
            except TypeError:
                gltype=self.getGLType(value[0])
                self.getSetter(gltype,length,False)(location, *[gltype(x) for x in value])
        except TypeError as e:
            gltype=self.getGLType(value)
            self.getSetter(gltype,1,False)(location,gltype(value))
            
    def getSetter(self,gltype,size, isArray):
        if gltype==gl.GLfloat:
            typestr='f'
        if gltype==gl.GLint:
            typestr='i'
        if gltype==gl.GLuint:
            typestr='ui'
        if isArray:
            return getattr(gl,f'glUniform{size}{typestr}v')
        else:
            return getattr(gl,f'glUniform{size}{typestr}')

    def getGLType(self,value):
        if isinstance(value,gl.GLuint):
            return gl.GLuint
        if isinstance(value,gl.GLint):
            return gl.GLint
        if isinstance(value,gl.GLfloat):
            return gl.GLfloat
        if isinstance(value,float):
            return gl.GLfloat
        if isinstance(value,int):
            return gl.GLint
        raise Exception('unknown type: %s'%value)

    def __enter__(self):
        self.SupplyValues()

    def __exit__(self, type, value, traceback):
        """right now, all I know to do for sure is put active texture back to unit 0"""
        if self.bound_textures:
            gl.glActiveTexture(gl.GL_TEXTURE0)
