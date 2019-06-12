const imgs = [{'imageId':1},{'imageId':2},{'imageId':13}]
const urls = imgs.map(obj => {
  return {'url': 'http://ec2-18-188-44-41.us-east-2.compute.amazonaws.com/getImage/' + obj.imageId}
})
const urls2 = []
for (const img of imgs)
  urls2.push({'url': 'http://ec2-18-188-44-41.us-east-2.compute.amazonaws.com/getImage/' + img.imageId})

console.log(urls)
console.log(urls2)
