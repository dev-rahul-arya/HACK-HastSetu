from preprocess import normalize_landmarks
import time
from pathlib import Path

import cv2
import mediapipe as mp
import numpy as np


# ============================================================
# 1. PROJECT PATHS
# ============================================================

# hand_tracker.py is inside:
# isl-recogniser/src/hand_tracker.py
#
# parent        -> src
# parent.parent -> isl-recogniser

PROJECT_ROOT = Path(__file__).resolve().parent.parent

MODEL_PATH = PROJECT_ROOT / "models" / "hand_landmarker.task"


# ============================================================
# 2. CHECK MEDIAPIPE MODEL
# ============================================================

print("\n--- ISL Hand Tracker ---")
print(f"Project directory : {PROJECT_ROOT}")
print(f"Model path        : {MODEL_PATH}")


if not MODEL_PATH.exists():
    raise FileNotFoundError(
        "\nHand Landmarker model was not found.\n"
        f"Expected location:\n{MODEL_PATH}\n"
    )


model_size = MODEL_PATH.stat().st_size

print(f"Model size        : {model_size / (1024 * 1024):.2f} MB")


# A real .task model should not be tiny.
if model_size < 100_000:
    raise RuntimeError(
        "\nThe hand_landmarker.task file looks too small.\n"
        "It may not have downloaded correctly."
    )


# ============================================================
# 3. MEDIAPIPE CONFIGURATION
# ============================================================

BaseOptions = mp.tasks.BaseOptions

HandLandmarker = mp.tasks.vision.HandLandmarker
HandLandmarkerOptions = mp.tasks.vision.HandLandmarkerOptions

RunningMode = mp.tasks.vision.RunningMode


options = HandLandmarkerOptions(

    base_options=BaseOptions(
        model_asset_path=str(MODEL_PATH)
    ),

    # We are processing sequential webcam frames
    running_mode=RunningMode.VIDEO,

    # ISL may eventually require two hands
    num_hands=2,

    min_hand_detection_confidence=0.5,

    min_hand_presence_confidence=0.5,

    min_tracking_confidence=0.5,
)


# ============================================================
# 4. HAND CONNECTIONS
# ============================================================

# MediaPipe returns 21 landmarks.
#
# These pairs describe which landmarks should be connected
# when drawing the hand skeleton.

HAND_CONNECTIONS = [

    # Thumb
    (0, 1),
    (1, 2),
    (2, 3),
    (3, 4),

    # Index finger
    (0, 5),
    (5, 6),
    (6, 7),
    (7, 8),

    # Middle finger
    (5, 9),
    (9, 10),
    (10, 11),
    (11, 12),

    # Ring finger
    (9, 13),
    (13, 14),
    (14, 15),
    (15, 16),

    # Pinky
    (13, 17),
    (17, 18),
    (18, 19),
    (19, 20),

    # Palm
    (0, 17),
]


# ============================================================
# 5. DRAW HAND
# ============================================================

def draw_hand(frame, landmarks):

    height, width, _ = frame.shape

    points = []

    # --------------------------------------------------------
    # Convert normalized coordinates into screen coordinates
    # --------------------------------------------------------

    for landmark in landmarks:

        x = int(landmark.x * width)
        y = int(landmark.y * height)

        points.append((x, y))


    # --------------------------------------------------------
    # Draw skeleton connections
    # --------------------------------------------------------

    for start_index, end_index in HAND_CONNECTIONS:

        start_point = points[start_index]
        end_point = points[end_index]

        cv2.line(
            frame,
            start_point,
            end_point,
            (255, 255, 255),
            2
        )


    # --------------------------------------------------------
    # Draw landmarks
    # --------------------------------------------------------

    for index, point in enumerate(points):

        cv2.circle(
            frame,
            point,
            5,
            (0, 255, 0),
            -1
        )


        # Display landmark number
        cv2.putText(
            frame,
            str(index),
            (point[0] + 6, point[1] - 6),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.4,
            (0, 255, 255),
            1,
            cv2.LINE_AA
        )


# ============================================================
# 6. MAIN PROGRAM
# ============================================================

def main():

    print("\nLoading MediaPipe Hand Landmarker...")


    # --------------------------------------------------------
    # Create MediaPipe detector
    # --------------------------------------------------------

    try:

        landmarker = HandLandmarker.create_from_options(options)

    except Exception as error:

        print("\nCould not load MediaPipe Hand Landmarker.")
        print("Error:", error)

        return


    print("MediaPipe model loaded successfully.")


    # --------------------------------------------------------
    # Open webcam
    # --------------------------------------------------------

    print("\nOpening camera...")


    # CAP_AVFOUNDATION works well with macOS cameras
    cap = cv2.VideoCapture(
        0,
        cv2.CAP_AVFOUNDATION
    )


    if not cap.isOpened():

        print("\nCould not open the camera.")
        print(
            "Check macOS System Settings -> "
            "Privacy & Security -> Camera."
        )

        landmarker.close()

        return


    print("Camera opened successfully.")
    print("\nPress Q or ESC to quit.\n")


    # --------------------------------------------------------
    # Camera settings
    # --------------------------------------------------------

    cap.set(
        cv2.CAP_PROP_FRAME_WIDTH,
        1280
    )

    cap.set(
        cv2.CAP_PROP_FRAME_HEIGHT,
        720
    )


    start_time = time.monotonic()

    previous_time = time.monotonic()


    # ========================================================
    # 7. CAMERA LOOP
    # ========================================================

    while True:

        success, frame = cap.read()


        if not success:

            print("Failed to read camera frame.")

            break


        # ----------------------------------------------------
        # Mirror webcam
        # ----------------------------------------------------

        frame = cv2.flip(frame, 1)


        # ----------------------------------------------------
        # OpenCV uses BGR
        # MediaPipe requires RGB
        # ----------------------------------------------------

        rgb_frame = cv2.cvtColor(
            frame,
            cv2.COLOR_BGR2RGB
        )


        # Make sure memory is contiguous
        rgb_frame = np.ascontiguousarray(rgb_frame)


        # ----------------------------------------------------
        # Convert OpenCV frame into MediaPipe Image
        # ----------------------------------------------------

        mp_image = mp.Image(

            image_format=mp.ImageFormat.SRGB,

            data=rgb_frame
        )


        # ----------------------------------------------------
        # MediaPipe VIDEO mode requires increasing timestamps
        # ----------------------------------------------------

        timestamp_ms = int(
            (time.monotonic() - start_time) * 1000
        )


        # ----------------------------------------------------
        # Detect hands
        # ----------------------------------------------------

        result = landmarker.detect_for_video(
            mp_image,
            timestamp_ms
        )


        # ====================================================
        # 8. PROCESS DETECTED HANDS
        # ====================================================

        if result.hand_landmarks:

            number_of_hands = len(
                result.hand_landmarks
            )


            cv2.putText(
                frame,
                f"Hands: {number_of_hands}",
                (20, 40),
                cv2.FONT_HERSHEY_SIMPLEX,
                1,
                (0, 255, 0),
                2,
                cv2.LINE_AA
            )


            # ------------------------------------------------
            # Draw every detected hand
            # ------------------------------------------------

            for hand_index, landmarks in enumerate(
                result.hand_landmarks
            ):
                features = normalize_landmarks(landmarks)

                # print("Feature shape:", features.shape)
                # print(features)

                draw_hand(
                    frame,
                    landmarks
                )


                # --------------------------------------------
                # Get Left / Right hand information
                # --------------------------------------------

                if hand_index < len(result.handedness):

                    handedness = result.handedness[
                        hand_index
                    ][0]


                    hand_name = handedness.category_name

                    confidence = handedness.score


                    cv2.putText(
                        frame,
                        f"{hand_name}: {confidence * 100:.1f}%",
                        (20, 80 + hand_index * 40),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.8,
                        (0, 255, 255),
                        2,
                        cv2.LINE_AA
                    )


        else:

            cv2.putText(
                frame,
                "No hand detected",
                (20, 40),
                cv2.FONT_HERSHEY_SIMPLEX,
                1,
                (0, 0, 255),
                2,
                cv2.LINE_AA
            )


        # ====================================================
        # 9. FPS COUNTER
        # ====================================================

        current_time = time.monotonic()

        delta_time = current_time - previous_time


        if delta_time > 0:

            fps = 1 / delta_time

        else:

            fps = 0


        previous_time = current_time


        cv2.putText(
            frame,
            f"FPS: {fps:.1f}",
            (20, frame.shape[0] - 20),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (255, 255, 255),
            2,
            cv2.LINE_AA
        )


        # ====================================================
        # 10. SHOW CAMERA
        # ====================================================

        cv2.imshow(
            "ISL Hand Tracker",
            frame
        )


        key = cv2.waitKey(1) & 0xFF


        # ESC
        if key == 27:
            break


        # Q
        if key == ord("q"):
            break


    # ========================================================
    # 11. CLEANUP
    # ========================================================

    print("\nClosing hand tracker...")


    cap.release()

    cv2.destroyAllWindows()

    landmarker.close()


    print("Done.")


# ============================================================
# PROGRAM ENTRY POINT
# ============================================================

if __name__ == "__main__":
    main()