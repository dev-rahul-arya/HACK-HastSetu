import numpy as np


def normalize_landmarks(landmarks):
    """
    Convert MediaPipe's 21 hand landmarks into a normalized
    63-value feature vector.

    Each landmark contains:
        x, y, z

    Returns:
        numpy array with shape (63,)
    """

    # -----------------------------------------
    # Convert MediaPipe landmarks to NumPy
    # -----------------------------------------

    points = np.array(
        [
            [landmark.x, landmark.y, landmark.z]
            for landmark in landmarks
        ],
        dtype=np.float32
    )

    # points shape:
    #
    # (21, 3)
    #
    # [
    #   [x0, y0, z0],
    #   [x1, y1, z1],
    #   ...
    #   [x20, y20, z20]
    # ]


    # -----------------------------------------
    # STEP 1: Translation normalization
    # -----------------------------------------
    #
    # Landmark 0 is the wrist.
    #
    # Subtract it from every point so that the
    # wrist becomes:
    #
    # (0, 0, 0)

    wrist = points[0].copy()

    points = points - wrist


    # -----------------------------------------
    # STEP 2: Scale normalization
    # -----------------------------------------
    #
    # Find the largest distance from the wrist.
    #
    # This makes large and small hands roughly
    # the same scale.

    distances = np.linalg.norm(
        points,
        axis=1
    )

    max_distance = np.max(distances)


    # Prevent division by zero
    if max_distance > 0:
        points = points / max_distance


    # -----------------------------------------
    # STEP 3: Flatten
    # -----------------------------------------
    #
    # (21, 3)
    #
    # becomes
    #
    # (63,)
    #
    # [x0,y0,z0,x1,y1,z1,...]

    features = points.flatten()


    return features