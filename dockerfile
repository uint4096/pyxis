FROM rust:bookworm AS base
WORKDIR /app

COPY ./crates ./crates
COPY Cargo.toml Cargo.lock ./
RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
RUN unzip -q awscliv2.zip
RUN ./aws/install

FROM base AS dev
RUN cargo build -p pyxis-server
CMD [ "cargo", "run", "-p" , "pyxis-server" ]

FROM base AS prod
RUN cargo build --release -p pyxis-server
CMD ["./target/release/pyxis-server"]
