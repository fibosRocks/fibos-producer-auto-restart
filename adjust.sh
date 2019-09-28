source set-env.sh

curl --data-binary '{"produce_time_offset_us":-80000}' http://127.0.0.1:$http_port/v1/producer/update_runtime_options
curl --data-binary '{"last_block_time_offset_us":-200000}' http://127.0.0.1:$http_port/v1/producer/update_runtime_options
