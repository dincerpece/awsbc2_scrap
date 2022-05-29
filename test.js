sudo yum update -y
sudo yum upgrade -y
cd /home/ec2-user/
curl -sL https://rpm.nodesource.com/setup_16.x | sudo bash -
sudo yum install -y nodejs
sudo yum install -y gcc-c++ make
sudo yum install -y git
sudo npm install -g npm@8.11.0
sudo npm install pm2 -g
git clone https://github.com/sinanartun/awsbc1_scrap.git
    cd /home/ec2-user/awsbc1_scrap