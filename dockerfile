FROM rust:bookworm as base
WORKDIR /app

COPY ./crates ./crates
COPY Cargo.toml Cargo.lock ./
RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
RUN unzip awscliv2.zip
RUN ./aws/install

FROM base as dev
RUN cargo build -p pyxis-server
CMD [ "cargo", "run", "-p" , "pyxis-server" ]

FROM base as prod
RUN cargo build --release -p pyxis-server
CMD ["./target/release/pyxis-server"]
