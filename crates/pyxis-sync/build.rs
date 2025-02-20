use dotenv::dotenv;
use std::env;

fn main() {
    dotenv().ok();

    let base_url = env::var("APP_BASE_URL").unwrap();

    println!("cargo:rustc-env=APP_BASE_URL={}", base_url);
}
