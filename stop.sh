source set-env.sh

docker update --restart=no $container_name
docker stop $container_name -t 200
docker rm -f  $container_name
