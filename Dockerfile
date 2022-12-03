# node.js with Grunt

FROM node:19

# Install Bower & Grunt
RUN npm install -g grunt-cli

# Define working directory.
WORKDIR /root

# Define default command.
CMD ["bash"]
