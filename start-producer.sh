source set-env.sh

docker rm -f $container_name

docker run -d --name $container_name \
    -v $PWD:/fibos \
    -p $http_port:8888 -p $p2p_port:9876 \
    --restart=always \
    $docker_tag fibos producer.js
