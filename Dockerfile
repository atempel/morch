# Base: Node 20 LTS (Debian Bookworm) — includes npm/npx
FROM node:20-bookworm

# ── System packages ──────────────────────────────────────────────────────
# Core tools + Tauri v2 native dependencies (GTK3, WebKit2GTK 4.1, etc.)
# Morch is scaffolded as Tauri v2 + React + TS (see DECISIONS.md, M1).
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    git \
    unzip \
    python3 \
    build-essential \
    pkg-config \
    libssl-dev \
    libgtk-3-dev \
    libwebkit2gtk-4.1-dev \
    libappindicator3-dev \
    librsvg2-dev \
    patchelf \
    && rm -rf /var/lib/apt/lists/*

# ── GitHub CLI (gh) ──────────────────────────────────────────────────────
# Used for repo setup / PR workflow (see IMPLEMENTATION_PLAN.md "Repo setup").
RUN curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg \
    | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg \
    && chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" \
    | tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
    && apt-get update && apt-get install -y --no-install-recommends gh \
    && rm -rf /var/lib/apt/lists/*

# ── Rust toolchain ───────────────────────────────────────────────────────
# Defaults kept at /root/.cargo and /root/.rustup so the named volumes in
# docker-compose.yml map to the same paths.
ENV RUSTUP_HOME=/root/.rustup \
    CARGO_HOME=/root/.cargo
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | \
    sh -s -- -y --no-modify-path --default-toolchain stable
ENV PATH="/root/.cargo/bin:${PATH}"

# ── Global Node tools ────────────────────────────────────────────────────
RUN npm install -g @anthropic-ai/claude-code

WORKDIR /workspace

CMD ["/bin/bash"]
