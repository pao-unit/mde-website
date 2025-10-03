import sys
from contextlib import contextmanager


# https://github.com/pao-unit/MDE/pull/1#issuecomment-3367249124
@contextmanager
def reset_argv(args=None):
    old = sys.argv
    sys.argv = [old[0]] + (args or [])
    try:
        yield
    finally:
        sys.argv = old
