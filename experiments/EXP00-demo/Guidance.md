# Procedure & Guidance — EXP00 Demo Lab

Follow these step-by-step instructions to test all capabilities of the VLab platform.

---

### Step 1: Start the Virtual Lab
1. Click the green **Start Lab** button on the top right panel.
2. Watch the status indicator transition through:
   - `Validate manifest` → `Check Docker` → `Isolated network` → `Pull / build images` → `Start containers` → `Wait until ready`.
3. Once ready, the lab status badge will turn green (**Running**).

---

### Step 2: Access the Target Web Server
1. Switch to the **Lab** tab in the main view.
2. Click **Open Target** or view the embedded preview window loading `http://127.0.0.1:3000`.
3. Click **Test Status API** inside the target page to confirm live HTTP response generation.

---

### Step 3: Attacker Terminal Operations
1. Open the embedded terminal panel at the bottom of the **Lab** tab.
2. Verify you are connected inside the `attacker` container (`attacker@exp00-demo $`).
3. Run the following HTTP reconnaissance commands:
   ```sh
   # Probe the target web server inside the isolated network
   curl -i http://target:3000/api/status
   ```
4. Test parameter reflections:
   ```sh
   curl -s "http://target:3000/api/search?q=VLabReconTest"
   ```
5. Trigger metric telemetry from terminal:
   ```sh
   curl -s http://target:3000/api/stress
   ```

---

### Step 4: Monitor Telemetry & Live Metrics
1. View the **Metrics** section on the right side of the screen.
2. Observe live container CPU %, Memory usage (MB / %), and HTTP requests per second (RPS).
3. Notice how hitting `/api/stress` visually increases CPU and Request rates on the charts.

---

### Step 5: Complete the Assessment Quiz
1. Switch to the **Quiz** tab.
2. Answer the 3 multiple-choice questions based on your observations.
3. Click **Submit Quiz** to check your score and detailed explanations.

---

### Step 6: Stop & Reset Lab
1. Click **Reset Lab** to test clean teardown and re-initialization.
2. Click **Stop Lab** to verify that all containers, temporary bridge networks, and volumes are automatically removed.
