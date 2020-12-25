# -*- coding: utf-8 -*-

"""Generate data.npz"""

import numpy as np

np.random.seed(1)

x = np.random.rand(3, 4)
y = (np.random.rand(2, 3, 2) * 10).astype(np.int32)
z = np.arange(10)
w = np.random.rand(5) > 0.5

np.savez('./tests/data.npz', x=x, y=y, z=z, w=w)

