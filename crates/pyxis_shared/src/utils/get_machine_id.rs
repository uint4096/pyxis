use machineid_rs::{Encryption, HWIDComponent, IdBuilder};
use uuid::Uuid;

pub fn get_machine_id() -> Uuid {
    let key = "machineid_key";
    let mut builder = IdBuilder::new(Encryption::SHA1);
    builder
        .add_component(HWIDComponent::Username)
        .add_component(HWIDComponent::OSName)
        .add_component(HWIDComponent::SystemID);
    let system_id = builder.build(key).expect("Failed to build machine id!");

    Uuid::new_v5(&Uuid::NAMESPACE_DNS, system_id.as_bytes())
}
