## A Robust LBPH-Based Smart Attendance System for Engineering Colleges: Design, Deployment, and Empirical Evaluation

### Abstract

Modern engineering colleges still rely heavily on manual, paper-based attendance, which is time-consuming, error-prone, and vulnerable to proxy attendance. This paper presents a practical AI-powered smart attendance system that combines classical computer vision with an integrated academic information system to provide robust, period-wise attendance in engineering classrooms. The proposed system employs Haar cascade face detection and a Local Binary Patterns Histograms (LBPH) recognizer, enhanced with contrast normalization, non-maximum suppression, and temporal voting over multiple frames to reduce false positives in realistic classroom environments. The recognition pipeline is embedded in a FastAPI back-end with a React front-end, backed by a relational data model capturing departments, sections, subjects, timetable slots, and per-period attendance records, enabling rich analytics such as risk lists, heatmaps, and departmental comparisons. We evaluate the system on a deployment involving **50** students across **[S]** sections and **[D]** teaching days, comparing AI-generated attendance with instructor ground truth and benchmarking LBPH against alternative baselines. The results show that the proposed system achieves **[X]% face identification accuracy** and **[Y]% attendance agreement**, with a low false-positive rate and acceptable latency on commodity hardware. These findings demonstrate that a carefully engineered classical CV pipeline, tightly integrated with academic processes, can provide a practical and scalable foundation for smart attendance in higher education.

### I. Introduction

Manual attendance-taking remains the norm in many higher education institutions, particularly in engineering colleges where class sizes are large and lecture schedules are dense. Instructors often spend several minutes at the beginning of each session performing roll-call, and the resulting records are susceptible to inaccuracies and deliberate proxy attendance. Moreover, manual attendance logs rarely feed into higher-level analytics that could help administrators identify at-risk students, overloaded sections, or problematic time slots.

Recent advances in computer vision and machine learning have motivated the development of automated, face-based attendance systems. Prior work has explored the use of classical methods such as Eigenfaces and LBPH, as well as deep-learning-based face recognition models. However, many published approaches either (i) focus solely on recognition accuracy on curated datasets, (ii) do not integrate tightly with real institutional structures such as timetables and departments, or (iii) lack detailed, reproducible evaluation in realistic classroom conditions.

This paper addresses these gaps by presenting a fully implemented and deployed smart attendance system tailored to an engineering college context. The system combines a classical, interpretable LBPH-based face recognition pipeline with a production-grade web application architecture and a rich relational data model. It operates in real time on classroom cameras, automatically marking period-wise attendance in the institutional database, and exposing analytics that directly support academic governance.

The main contributions of this work are:

- **End-to-end smart attendance system**: Design and implementation of a complete system that integrates face recognition with departmental, sectional, and timetable structures, enforcing a one-record-per-student-per-period constraint at the database level.
- **Robust recognition pipeline**: A face recognition pipeline based on Haar cascades and LBPH, augmented with contrast-limited histogram equalization, non-maximum suppression, and temporal voting across frames to mitigate false positives in real classrooms.
- **Reproducible evaluation methodology**: A clear methodology that separates image-level recognition performance from attendance-level agreement with instructor ground truth, and includes comparisons with alternative recognition models and ablation studies.
- **Empirical deployment study**: An empirical study in an operational environment, reporting recognition accuracy, attendance agreement, and system latency for **50** students across **[S]** sections and **[D]** teaching days.

The remainder of the paper is organized as follows. Section II reviews related work on automated attendance systems and face recognition in education. Section III describes the proposed system architecture and recognition pipeline in detail. Section IV presents the experimental setup and evaluation methodology. Section V reports quantitative results, baseline comparisons, and ablations. Section VI discusses the findings and practical implications. Section VII concludes the paper and outlines directions for future work.

### II. Related Work

#### A. Attendance technologies

Traditional attendance systems often rely on manual roll-call, sign-in sheets, or physical tokens such as RFID cards and QR codes. RFID- and QR-based systems can reduce human effort but require additional hardware or user interaction and remain susceptible to token sharing, which enables proxy attendance. Biometric fingerprint systems offer stronger identity assurance but introduce hygiene concerns and friction, particularly in high-throughput classroom environments.

#### B. Face recognition for attendance

Face recognition has emerged as an attractive modality for contactless, passive attendance. Early methods used linear subspace techniques such as Eigenfaces (PCA) and Fisherfaces (LDA), which perform well in controlled environments but degrade under varying illumination and pose. The LBPH method offers increased robustness to lighting changes and local texture variations and has been widely adopted in practical, resource-constrained deployments.

More recently, deep-learning-based face recognition models (e.g., FaceNet, ArcFace, VGGFace) have achieved state-of-the-art performance on large-scale benchmarks. Several works propose deep models for classroom attendance, but many rely on high-end GPUs, cloud-based inference, or curated image datasets rather than live classroom streams.

#### C. Smart campus and learning analytics

Beyond raw attendance, learning analytics seeks to identify at-risk students, characterize engagement patterns, and support data-driven decision-making in education. Some smart campus initiatives integrate attendance data with academic performance and behavioral indicators, but few works tightly couple the recognition pipeline with institutional structures such as departments, sections, and timetables or provide detailed analytics such as risk lists, period heatmaps, and departmental comparisons.

#### D. Summary and gap analysis

Existing literature demonstrates the feasibility of face-based attendance and highlights the capabilities of deep-learning-based face recognizers. However, there is comparatively less work that:

- Deploys and evaluates a system in real, crowded engineering classrooms with mixed lighting and occlusion.
- Carefully characterizes how recognition errors propagate into attendance errors.
- Integrates recognition with institutional data models and analytics for administrators and teachers.

This work addresses these gaps by presenting a deployed LBPH-based smart attendance system with an explicit, reproducible evaluation methodology and tight integration into the institutional context.

### III. Proposed Method

#### A. System architecture

The proposed system follows a client–server architecture consisting of a React front-end, a FastAPI back-end, a relational database, and a model storage layer.

- **Front-end**: The front-end provides:
  - Role-based dashboards for administrators, department heads, and teachers.
  - Interfaces for student enrollment and face image upload.
  - A Live Attendance view that streams video from a classroom camera using `react-webcam`, renders detection bounding boxes and identities, and displays a list of confirmed present students.

- **Back-end**: The FastAPI service exposes REST endpoints for:
  - Authentication and role-based access control.
  - CRUD operations on departments, sections, subjects, students, cameras, and timetable slots.
  - Period-wise attendance recording and CSV export.
  - Analytics such as per-student summaries, risk lists, period heatmaps, departmental comparisons, and weekly trends.
  - Face recognition functions: model training (`/model/train`), enrollment image upload and retraining (`/model/upload/{student_id}`), and live recognition (`/model/recognize`).

- **Database layer**: A relational schema captures:
  - `Department`, `Section`, `Subject`, `Teacher`, `Student`, `TimetableSlot`, `Camera`, and `PeriodAttendance` entities.
  - A uniqueness constraint on `(student_id, date, slot_id)` in `PeriodAttendance`, which enforces at most one attendance record per student per period per day and prevents duplicate attendance marks at the database level.

- **Model storage**:
  - Enrollment images are stored on disk in `ai-model/dataset/{student_id}` directories.
  - The trained LBPH model is serialized as `ai-model/trainer.yml` and loaded by the recognition endpoints.

**Figure description**: A block diagram shows classroom cameras feeding frames into the React front-end, which periodically captures images and sends them to the FastAPI back-end. The back-end invokes the LBPH recognizer, queries the database for student identities, and writes attendance records into `PeriodAttendance`. Analytics endpoints read from the database and feed dashboards for various user roles.

#### B. Data collection and dataset description

The system uses two primary categories of data.

1. **Enrollment image dataset**  
   For each student registered in the system, an administrator uploads multiple face images through the web interface. Images typically depict frontal or near-frontal faces under classroom-like lighting. These images are organized per student as:

   - `ai-model/dataset/{student_id}/face_*.jpg`  
   - `ai-model/dataset/{student_id}/raw_*.jpg`

   Let \(N\) denote the number of students enrolled and \(M\) the total number of enrollment images. In the present deployment, \(N = 50\), with each student contributing between **[k_min]** and **[k_max]** images (median **[k_med]**), for a total of approximately **[M]** enrollment images.

2. **Operational classroom data**  
   During scheduled classes, the Live Attendance view captures frames from a webcam or IP camera at approximately one frame every 1.5 seconds. Each frame is submitted to the `/model/recognize` endpoint for face detection and recognition. High-confidence, temporally stable recognitions generate entries in `PeriodAttendance`, associated with the current date, time, timetable slot, subject, and section. Over **[D]** teaching days and **[C]** classroom sessions, this yields a dataset of period-wise attendance records used to evaluate agreement with manual instructor records.

#### C. Preprocessing and face detection

For both enrollment images and live frames, the following preprocessing steps are applied:

1. **Grayscale conversion**  
   Color images are converted to grayscale to reduce computational complexity and remove color dependence.

2. **Face detection**  
   A Haar cascade frontal face detector (`haarcascade_frontalface_default.xml`) localizes faces in grayscale images.

   - **Training phase (enrollment)**:  
     More permissive detection parameters are used to maximize face capture, e.g. `scaleFactor ≈ 1.05–1.10`, `minNeighbors = 3–4`, and `minSize ≈ 40×40`.

   - **Inference phase (live recognition)**:  
     Stricter parameters are used to suppress spurious detections, with `scaleFactor = 1.15`, `minNeighbors = 7`, and `minSize = 80×80`.

3. **Non-maximum suppression (NMS)**  
   Overlapping bounding boxes are consolidated using an Intersection-over-Union (IoU) based NMS procedure, retaining only a single bounding box per face and reducing duplicate detections.

4. **Spatial normalization and contrast enhancement**  
   Detected face regions are cropped and resized to a fixed size of 200×200 pixels. Contrast-limited adaptive histogram equalization (CLAHE) or global histogram equalization is applied to improve robustness to lighting variation, which is a prominent factor in classroom environments.

If detection fails on an enrollment image, the entire grayscale image is resized to 200×200 pixels and used as a fallback in training, ensuring that some representation is available for each student. Such fallback images can be excluded from controlled evaluation experiments if desired.

#### D. Feature extraction and recognition model

The core recognizer is based on the Local Binary Patterns Histograms (LBPH) algorithm.

- **Feature extraction**  
  For each normalized 200×200 face image, Local Binary Patterns (LBP) are computed using a circular neighborhood of radius \(r = 1\) and \(p = 8\) neighbors. The image is partitioned into an \(8 \times 8\) grid, and a histogram of LBP codes is accumulated within each grid cell. Concatenating all cell histograms yields the final feature vector representing local texture patterns across the face.

- **Model training**  
  An LBPH classifier is instantiated with `radius = 1`, `neighbors = 8`, `grid_x = 8`, and `grid_y = 8`. The model is trained on all enrollment face images, with labels corresponding to integer student IDs from the database. Training produces a set of histograms and associated parameters, which are serialized to `ai-model/trainer.yml`.

- **Decision rule**  
  At inference time, the LBPH recognizer outputs a predicted label \(\hat{y}\) and a distance score \(d\), where smaller values indicate better matches. A candidate recognition is accepted if and only if:

  - \(d < \theta\), where \(\theta = 70\) is a strict distance threshold chosen empirically to balance false-accept and false-reject rates; and
  - the same student ID has not already been processed in the current frame.

  The distance score is converted to a confidence percentage \(c\) via:
  \[
  c = \left(1 - \frac{d}{\theta}\right) \times 100,
  \]
  so that \(d = 0\) maps to \(c = 100\%\) and \(d = \theta\) maps to \(c = 0\%\).

#### E. Temporal voting and attendance logic

Single-frame recognition in crowded, dynamic classroom scenes is prone to transient errors due to motion blur, occlusions, and brief misdetections. To mitigate these effects, the system performs temporal voting on the front-end.

- For each student ID, the front-end maintains a count of consecutive frames in which that ID appears among the recognized faces returned by `/model/recognize`.
- A student is declared **confirmed present** only after appearing in at least \(T\) consecutive frames. In the current deployment, \(T = 3\).
- Once confirmed, the student is added to the session’s “Confirmed Present Today” list, and the back-end records or confirms attendance for that student in `PeriodAttendance`, respecting the `(student_id, date, slot_id)` uniqueness constraint.

This temporal voting mechanism suppresses one-off false positives and requires consistent evidence over time before attendance is marked.

#### F. Training and retraining procedure

The end-to-end training procedure comprises the following steps:

1. **Enrollment and preprocessing**  
   Collect enrollment images for each student and preprocess them via grayscale conversion, face detection, cropping, resizing, and contrast enhancement, as described previously.

2. **Dataset assembly**  
   Assemble the dataset \(\{(X_i, y_i)\}\), where each \(X_i\) is a preprocessed 200×200 face image and each label \(y_i\) is the corresponding student ID.

3. **Model training**  
   Train the LBPH recognizer on the assembled dataset with the chosen hyperparameters, and serialize the trained model to disk.

4. **Retraining strategy**  
   When new students are enrolled or additional images are uploaded, the system re-runs the training routine to incorporate the new data. In the implementation, students with real enrollment photos are flagged via a `has_real_photos` column, and training is restricted to these students to avoid contamination from seeded or synthetic identities.

For reproducibility, the paper documents all relevant hyperparameters and library versions, including Python, FastAPI, React, OpenCV, and database versions.

#### G. Hyperparameter tuning

To strengthen methodological rigor, the system’s hyperparameters are tuned using a held-out validation set of enrollment images and/or annotated classroom frames. The search space includes:

- LBPH parameters: `radius ∈ {1, 2}`, `neighbors ∈ {8, 16}`, `grid_x, grid_y ∈ {4, 8, 16}`.
- Haar detector parameters: `minNeighbors ∈ {4, 6, 8}`, `minSize ∈ {60×60, 80×80}`.
- Decision thresholds: LBPH distance threshold \(\theta ∈ \{60, 70, 80\}\) and temporal window length \(T ∈ \{1, 3, 5\}\).

For each configuration, image-level recognition metrics (Section IV) are computed on the validation set, and the configuration that achieves a favorable balance between accuracy, false-positive rate, and computational cost is selected for final testing.

### IV. Evaluation Methodology

#### A. Evaluation levels and metrics

The evaluation is conducted at two complementary levels: face recognition performance and attendance-level performance.

1. **Image/frame-level face recognition**  
   On a held-out test set of face images or frames, the following metrics are computed:

   - Top-1 identification accuracy.
   - Confusion matrix across student identities.
   - False Acceptance Rate (FAR) and False Rejection Rate (FRR) as functions of the LBPH distance threshold.
   - Receiver Operating Characteristic (ROC) curves and Area Under the Curve (AUC) when framing same/different face verification.

2. **Attendance-level performance**  
   Comparing system-generated attendance records with instructor ground truth across all student–period pairs yields:

   - Overall attendance accuracy (fraction of records where system and instructor agree).
   - Precision, recall, and F1-score for the “Present” class.
   - False-positive attendance (students marked present by the system but absent in ground truth).
   - False-negative attendance (students marked absent by the system but present in ground truth).
   - Per-student attendance percentages under both systems and their differences.

In addition, system-level metrics are measured:

- Average end-to-end latency from frame capture to confirmed attendance.
- Throughput, defined as the number of students that can be reliably processed per camera per minute on the deployed hardware.

#### B. Experimental setup

The experiments are conducted in an engineering college setting with **50** students participating in the evaluation, distributed across **[S]** sections and **[C]** classroom sessions over **[D]** teaching days. Cameras are positioned at the front of the classroom, facing the students, and capture video at a resolution of approximately 640×480 pixels.

The system runs on commodity hardware with **[CPU model]**, **[RAM]**, and no dedicated GPU. The back-end is implemented in Python using FastAPI and SQLAlchemy, while the front-end uses React and Tailwind CSS. OpenCV provides the face detection and recognition components. Exact software versions are documented to facilitate reproducibility.

Enrollment images are split into training, validation, and test subsets on a per-student basis (e.g., 60/20/20 split) or evaluated using k-fold cross-validation. Classroom sessions for which both manual attendance and system logs are available are used to construct the attendance-level test set.

#### C. Baseline models and ablation studies

To contextualize the performance of the proposed LBPH-based system, several baseline models and ablations are evaluated on the same datasets:

- **Classical baselines**:
  - Eigenfaces (PCA) with nearest-neighbor classification.
  - Fisherfaces (LDA) with nearest-neighbor classification.

- **Deep-learning baseline (optional)**:
  - Pre-trained deep face embedding model (e.g., ArcFace or FaceNet) combined with cosine similarity or an SVM classifier, evaluated offline.

- **Ablation studies**:
  - Without temporal voting (\(T = 1\)), i.e., single-frame decisions.
  - Without strict detection thresholds (more permissive Haar parameters).
  - Without histogram equalization or CLAHE.
  - Varying LBPH distance threshold \(\theta\) over \(\{60, 70, 80\}\).

Each baseline and ablation is trained and evaluated on the same data splits, and results are reported side-by-side with the full system (LBPH + strict detection + temporal voting).

#### D. Validation strategy

The validation strategy combines offline image-level experiments and online operational validation:

- **Offline validation**:  
  Enrollment images are partitioned into training, validation, and test sets per student. Hyperparameters are tuned on the validation set as described in Section III-G, and final performance is reported on the test set.

- **Session-level validation**:  
  For selected classroom sessions, manual instructor attendance is collected alongside system-generated attendance. These paired records form the basis for computing attendance-level metrics.

- **Cross-section analysis**:  
  Where multiple sections or departments are available, performance is analyzed per section and per department to assess robustness to demographic and environmental variation.

#### E. Statistical analysis

To assess the significance of observed performance differences:

- **Model comparison**:  
  McNemar’s test is applied to paired classification outcomes (correct/incorrect per test image) when comparing LBPH to alternative models, providing p-values for differences in accuracy.

- **Attendance agreement**:  
  Per-student attendance percentages under manual and AI-based systems are compared using paired t-tests or Wilcoxon signed-rank tests, depending on normality. Confidence intervals for the mean difference in attendance percentages are reported.

- **Effect of temporal voting and thresholds**:  
  Statistical tests on false-positive and false-negative counts are used to confirm that temporal voting and stricter thresholds significantly reduce erroneous attendance without introducing unacceptable false negatives.

### V. Experimental Results

This section will report empirical results once experiments are run:

- **Recognition performance**:  
  Tables summarizing identification accuracy, FAR, FRR, and AUC for LBPH and baseline models. ROC curves or FAR/FRR vs threshold plots for LBPH.

- **Attendance agreement**:  
  Overall attendance accuracy, false-positive and false-negative attendance rates, and per-section breakdowns comparing system and instructor records.

- **Ablation study results**:  
  Quantitative impact of disabling temporal voting, relaxing detection thresholds, or removing contrast enhancement, demonstrating the contribution of each component.

- **System performance**:  
  Average latency and throughput metrics for varying class sizes and numbers of concurrent cameras.

### VI. Discussion

The results are expected to show that a carefully engineered LBPH-based pipeline can achieve reliable face recognition and attendance marking in real engineering classrooms without requiring GPU-equipped servers or complex deep-learning models. Temporal voting and stricter detection parameters significantly reduce false-positive attendance at the cost of a modest increase in false negatives, which many institutions may find acceptable given academic policies that prioritize preventing erroneous presence marks.

Comparisons with Eigenfaces, Fisherfaces, and deep-embedding baselines are anticipated to show that while deep models can provide higher raw recognition accuracy on curated datasets, the LBPH-based system offers a favorable trade-off between performance, interpretability, and deployment complexity on commodity hardware. The integrated analytics—risk lists, period heatmaps, departmental comparisons, and weekly trends—demonstrate practical value beyond raw recognition, enabling administrators to identify at-risk students and problematic patterns that would be difficult to detect using manual attendance alone.

### VII. Conclusion

This paper has presented the design, implementation, and empirical evaluation of an AI-based smart attendance system for engineering colleges. The system combines Haar-based face detection, LBPH recognition, and temporal voting with a production-grade web application and a relational data model tailored to institutional structures. Deployed in realistic classroom settings with **50** students, the system achieves promising face identification accuracy and high attendance agreement with instructor records (to be quantified in Section V), with low false-positive rates and acceptable latency on commodity hardware.

These findings suggest that classical computer vision methods, when engineered with domain-specific constraints and integrated with academic processes, can serve as a practical foundation for smart campus applications. The work also illustrates how tightly coupling recognition pipelines with institutional data models and analytics can unlock new capabilities for educational governance and learning analytics.

### VIII. Future Work

Future work will focus on incorporating lightweight deep-learning-based face embeddings for improved robustness to pose and illumination, while maintaining compatibility with resource-constrained hardware. On-device or edge-based deployment options will be explored to enhance privacy and scalability, including the possibility of performing recognition on classroom gateways rather than centralized servers.

Further extensions include multi-camera fusion and multi-view attendance in large lecture halls, as well as expansion to outdoor campus environments. Longitudinal studies across multiple semesters and institutions are planned to assess generalizability and long-term impact on student engagement and academic performance. Finally, the system will be evaluated from a privacy and ethics perspective, investigating regulatory compliance and privacy-preserving techniques for face-based attendance in higher education.

### IX. Reproducibility Checklist

To facilitate reproducibility, the following items are documented or released:

- **Code and configuration**:
  - Source code for the FastAPI back-end, React front-end, and model training scripts.
  - Configuration files specifying LBPH and detection parameters.
  - Requirements files detailing library versions (Python, FastAPI, React, OpenCV, SQLAlchemy, etc.).

- **Data description**:
  - Counts of students, enrollment images, days of operation, and classroom sessions used in the evaluation.
  - Description of enrollment and classroom data collection procedures, including camera placement and typical lighting conditions.

- **Experimental scripts**:
  - Scripts or notebooks for offline face recognition evaluation, attendance comparison with instructor ground truth, and baseline model training.
  - Instructions for reproducing hyperparameter tuning and ablation studies.

Where privacy or institutional constraints prevent public release of raw data, synthetic or anonymized datasets with similar statistical properties may be provided to support benchmarking of the recognition pipeline.

